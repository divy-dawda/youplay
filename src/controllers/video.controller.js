import mongoose, { isValidObjectId } from "mongoose"
import fs from "fs"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { Comment } from "../models/comment.models.js"
import { Like } from "../models/like.models.js"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    const matchConditions = {}

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        matchConditions.owner = new mongoose.Types.ObjectId(userId)
    }

    if (!userId || req.user?._id?.toString() !== userId.toString()) {
        matchConditions.isPublished = true
    }

    if (query && query.trim() !== "") {
        const trimmed = query.trim()
        const cleanQuery = trimmed.replace(/^@/, '')
        const escapedClean = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const escapedRaw = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const searchRegex = { $regex: escapedClean, $options: "i" }
        const rawRegex = { $regex: escapedRaw, $options: "i" }

        if (userId) {
            matchConditions.$or = [
                { title: rawRegex },
                { description: rawRegex }
            ]
        } else {
            const matchingUsers = await User.find({
                $or: [
                    { username: searchRegex },
                    { fullname: searchRegex }
                ]
            }).select("_id")

            const matchingUserIds = matchingUsers.map((u) => u._id)

            matchConditions.$or = [
                { title: rawRegex },
                { description: rawRegex },
                { owner: { $in: matchingUserIds } }
            ]
        }
    }

    const pipeline = [
        { $match: matchConditions },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ]

    const sortDirection = sortType?.toLowerCase() === "asc" ? 1 : -1
    const sortField = sortBy || "createdAt"
    pipeline.push({
        $sort: {
            [sortField]: sortDirection
        }
    })

    const options = {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10
    }

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options)

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || title.trim() === "") {
        throw new ApiError(400, "Title is required")
    }
    if (!description || description.trim() === "") {
        throw new ApiError(400, "Description is required")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    const videoFileSize = req.files?.videoFile?.[0]?.size
    const thumbnailSize = req.files?.thumbnail?.[0]?.size

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100 MB (Cloudinary Free limit)
    const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024 // 10 MB

    if (videoFileSize && videoFileSize > MAX_VIDEO_SIZE) {
        if (fs.existsSync(videoFileLocalPath)) fs.unlinkSync(videoFileLocalPath)
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
        throw new ApiError(400, `Video file exceeds the maximum allowed size of 100 MB (${(videoFileSize / (1024 * 1024)).toFixed(1)} MB). Cloudinary free tier allows up to 100 MB per video.`)
    }

    if (thumbnailSize && thumbnailSize > MAX_THUMBNAIL_SIZE) {
        if (videoFileLocalPath && fs.existsSync(videoFileLocalPath)) fs.unlinkSync(videoFileLocalPath)
        if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
        throw new ApiError(400, "Thumbnail image exceeds the maximum allowed size of 10 MB.")
    }

    let videoFile
    try {
        videoFile = await uploadOnCloudinary(videoFileLocalPath)
    } catch (err) {
        if (thumbnailLocalPath && fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
        throw new ApiError(400, err?.message || "Failed to upload video file to cloud storage")
    }

    let thumbnail
    try {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    } catch (err) {
        if (videoFile?.url) await deleteFromCloudinary(videoFile.url, "video")
        throw new ApiError(400, err?.message || "Failed to upload thumbnail to cloud storage")
    }

    if (!videoFile || !videoFile.url) {
        if (thumbnail?.url) await deleteFromCloudinary(thumbnail.url, "image")
        throw new ApiError(500, "Failed to upload video file to cloud storage")
    }
    if (!thumbnail || !thumbnail.url) {
        if (videoFile?.url) await deleteFromCloudinary(videoFile.url, "video")
        throw new ApiError(500, "Failed to upload thumbnail to cloud storage")
    }

    try {
        const video = await Video.create({
            title: title.trim(),
            description: description.trim(),
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            duration: videoFile.duration || 0,
            owner: req.user._id,
            isPublished: true
        })

        const createdVideo = await Video.findById(video._id)

        return res
            .status(201)
            .json(new ApiResponse(201, createdVideo, "Video published successfully"))
    } catch (error) {
        await deleteFromCloudinary(videoFile.url, "video")
        await deleteFromCloudinary(thumbnail.url, "image")
        throw new ApiError(500, error?.message || "Something went wrong while publishing the video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    })

    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        })
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                likes: 0
            }
        }
    ])

    if (!video?.length) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this video")
    }

    const updateFields = {}
    if (title && title.trim() !== "") {
        updateFields.title = title.trim()
    }
    if (description && description.trim() !== "") {
        updateFields.description = description.trim()
    }

    const thumbnailLocalPath = req.file?.path
    const thumbnailSize = req.file?.size
    if (thumbnailLocalPath) {
        const MAX_THUMBNAIL_SIZE = 10 * 1024 * 1024
        if (thumbnailSize && thumbnailSize > MAX_THUMBNAIL_SIZE) {
            if (fs.existsSync(thumbnailLocalPath)) fs.unlinkSync(thumbnailLocalPath)
            throw new ApiError(400, "Thumbnail image exceeds the maximum allowed size of 10 MB.")
        }
        let thumbnail
        try {
            thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        } catch (err) {
            throw new ApiError(400, err?.message || "Failed to upload thumbnail")
        }
        if (!thumbnail || !thumbnail.url) {
            throw new ApiError(500, "Failed to upload thumbnail")
        }
        if (video.thumbnail) {
            await deleteFromCloudinary(video.thumbnail, "image")
        }
        updateFields.thumbnail = thumbnail.url
    }

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "No fields to update provided")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        {
            returnDocument: 'after'
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this video")
    }

    // Delete video and thumbnail files from Cloudinary
    if (video.videoFile) {
        await deleteFromCloudinary(video.videoFile, "video")
    }
    if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail, "image")
    }

    await Video.findByIdAndDelete(videoId)
    await Comment.deleteMany({ video: videoId })
    await Like.deleteMany({ video: videoId })
    await Playlist.updateMany(
        {},
        {
            $pull: { videos: videoId }
        }
    )
    await User.updateMany(
        {},
        {
            $pull: { watchHistory: videoId }
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, { videoId }, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to toggle publish status of this video")
    }

    video.isPublished = !video.isPublished
    await video.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video publish status toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}