import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        // Remove locally saved temporary file on success
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    } catch (error) {
        // Remove locally saved temporary file on failure
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const getPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    try {
        if (!url.includes("/upload/")) {
            const parts = url.split("/");
            const filename = parts[parts.length - 1];
            const dotIdx = filename.lastIndexOf(".");
            return dotIdx !== -1 ? filename.substring(0, dotIdx) : filename;
        }
        const afterUpload = url.split("/upload/")[1];
        if (!afterUpload) return null;
        // Strip version prefix if present, e.g. v1726651234/
        const withoutVersion = afterUpload.replace(/^v\d+\//, "");
        // Strip extension
        const dotIdx = withoutVersion.lastIndexOf(".");
        return dotIdx !== -1 ? withoutVersion.substring(0, dotIdx) : withoutVersion;
    } catch (error) {
        console.error("Error extracting public ID from URL:", error);
        return null;
    }
};

const deleteFromCloudinary = async (urlOrPublicId, resourceType) => {
    try {
        if (!urlOrPublicId) return null;

        // Auto-detect resource type if not explicitly provided
        let detectedType = resourceType;
        if (!detectedType) {
            if (typeof urlOrPublicId === "string" && urlOrPublicId.includes("/video/")) {
                detectedType = "video";
            } else if (typeof urlOrPublicId === "string" && urlOrPublicId.includes("/raw/")) {
                detectedType = "raw";
            } else {
                detectedType = "image";
            }
        }

        const publicId = getPublicIdFromUrl(urlOrPublicId);
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: detectedType
        });
        return response;
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl
};