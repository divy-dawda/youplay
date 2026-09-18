import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: Anyone can read tweets
router.route("/user/:userId").get(optionalVerifyJWT, getUserTweets);

// Secured routes
router.route("/").post(verifyJWT, createTweet);
router.route("/:tweetId").patch(verifyJWT, updateTweet).delete(verifyJWT, deleteTweet);

export default router;