# 🎬 YouPlay — Full-Stack Video Sharing & Social Platform

A production-grade, full-stack video hosting and community platform inspired by YouTube, built with **Node.js, Express, MongoDB, Cloudinary, and React (Vite)**.

---

## 🚀 Features

### 👤 User & Authentication
- **Secure Auth**: JWT authentication using short-lived Access Tokens and long-lived Refresh Tokens stored in secure, `httpOnly` cookies.
- **Profiles**: Avatar & cover image upload via Cloudinary, password management, and account details update.
- **Watch History**: Tracks viewed videos with MongoDB aggregation pipelines.

### 🎥 Video Management
- **Media Upload**: Video and thumbnail upload with Multer and Cloudinary.
- **Video Controls**: Publish/unpublish toggle, edit details, and delete videos.
- **Search & Pagination**: Filter, sort, and paginate videos using `mongoose-aggregate-paginate-v2`.
- **View Counts**: Tracks video views.

### 💬 Community & Engagement
- **Likes & Comments**: Like/unlike videos, comments, and community tweets; threaded comment CRUD.
- **Channel Subscriptions**: Subscribe/unsubscribe with dynamic subscriber counts and channel stats.
- **Tweets / Community Posts**: Short text updates and community engagement.
- **Playlists**: Create custom playlists, add/remove videos, and manage visibility.

### 📊 Channel Dashboard
- Channel metrics including total video views, total subscribers, total videos, and total likes.

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Media Storage**: [Cloudinary](https://cloudinary.com/) & [Multer](https://github.com/expressjs/multer)
- **Security & Auth**: [JSON Web Tokens (JWT)](https://jwt.io/), [bcrypt](https://github.com/kelektiv/node.bcrypt.js), `cookie-parser`, `cors`

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)

---

## 📁 Project Structure

```text
youplay/
├── src/                      # Backend source code
│   ├── controllers/          # Request handlers (user, video, tweet, comment, etc.)
│   ├── db/                   # Database connection configuration
│   ├── middlewares/          # Auth (verifyJWT), multer file uploads, error handling
│   ├── models/               # Mongoose schemas (User, Video, Tweet, Comment, etc.)
│   ├── routes/               # Express route declarations
│   ├── utils/                # ApiError, ApiResponse, asyncHandler, Cloudinary utility
│   ├── app.js                # Express app setup & middlewares
│   └── index.js              # Server entry point
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page views (Home, History, Liked, etc.)
│   │   └── App.jsx           # Main React component
│   └── package.json
├── postman/                  # Postman collections & environments
├── .env.sample               # Sample environment variables
└── package.json              # Backend dependencies & scripts
```

---

## 🔌 API Endpoints Reference

All API routes are prefixed with `/api/v1`:

| Endpoint | Method | Description | Auth Required |
| :--- | :---: | :--- | :---: |
| `/users/register` | `POST` | Register a new user with avatar & cover | ❌ |
| `/users/login` | `POST` | Log in and receive access & refresh cookies | ❌ |
| `/users/logout` | `POST` | Log out and clear tokens | ✅ |
| `/users/refresh-token` | `POST` | Refresh access token | ❌ |
| `/users/current-user` | `GET` | Get current logged-in user profile | ✅ |
| `/users/change-password` | `POST` | Update password | ✅ |
| `/users/history` | `GET` | Get user watch history | ✅ |
| `/videos` | `GET` / `POST` | Fetch paginated videos / Upload new video | ✅ (Upload) |
| `/videos/:videoId` | `GET` / `PATCH` / `DELETE` | Video details, update metadata, delete | ✅ (Update/Delete) |
| `/comments/:videoId` | `GET` / `POST` | Fetch / Add comment to a video | ✅ (Post) |
| `/likes/toggle/v/:videoId` | `POST` | Toggle like on a video | ✅ |
| `/subscriptions/c/:channelId`| `POST` / `GET` | Subscribe / Get subscriber list | ✅ |
| `/tweets` | `GET` / `POST` | Get user tweets / Create tweet | ✅ |
| `/playlist` | `POST` / `GET` | Create playlist / Get user playlists | ✅ |
| `/dashboard/stats` | `GET` | Get channel statistics | ✅ |
| `/healthcheck` | `GET` | Healthcheck ping | ❌ |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory based on `.env.sample`:

```env
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net
CORS_ORIGIN=*

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🏃 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/youplay.git
cd youplay
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Set up environment variables
cp .env.sample .env

# Run backend development server
npm run dev
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
```bash
# In a separate terminal tab:
cd frontend

# Install frontend dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 📬 Postman Workspace
API endpoints are pre-configured in the `/postman` directory for rapid testing. Import the collection into Postman and set your `{{server}}` variable to `http://localhost:8000/api/v1`.

---

## 📄 License
This project is licensed under the [ISC](LICENSE) License.