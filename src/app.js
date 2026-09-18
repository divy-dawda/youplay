import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

const cleanAllowedOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.trim().replace(/\/+$/, '') : '*';

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like curl, server-to-server, mobile)
        if (!origin) return callback(null, true);

        const cleanOrigin = origin.trim().replace(/\/+$/, '');

        // If CORS_ORIGIN is wildcard, matches configured origin, is localhost, or is any vercel.app deployment
        if (
            cleanAllowedOrigin === '*' ||
            cleanOrigin === cleanAllowedOrigin ||
            cleanOrigin.endsWith('.vercel.app') ||
            cleanOrigin.includes('localhost') ||
            cleanOrigin.includes('127.0.0.1')
        ) {
            return callback(null, cleanOrigin);
        }

        return callback(null, cleanOrigin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// root status route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "YouPlay API server is live and running!",
        version: "v1",
        endpoints: "/api/v1",
        health: "/api/v1/healthcheck"
    });
});

// global error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
    const message = err.message || "Something went wrong";

    return res.status(statusCode).json({
        statusCode,
        data: null,
        message,
        success: false,
        errors: err.errors || []
    });
});

export {app}