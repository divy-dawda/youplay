// API client using fetch with automatic credentials and error handling

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(endpoint, options = {}, retries = 1) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = options.headers ? { ...options.headers } : {};

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include HTTP-only cookies (accessToken, refreshToken)
  };

  try {
    const response = await fetch(url, config);

    // If server is rate limiting or waking up (Render cold-start), automatically retry once
    if ((response.status === 429 || response.status === 503) && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return request(endpoint, options, retries - 1);
    }
    
    // Safely parse JSON or text without throwing SyntaxError
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    let rawText = '';

    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    } else {
      try {
        rawText = await response.text();
      } catch (e) {
        rawText = '';
      }
    }

    if (!response.ok) {
      // 1. Check if backend provided structured error message
      let message = data?.message;

      // 2. If it was an HTML error (e.g. Express fallback or proxy error), extract the clean text
      if (!message && rawText) {
        const preMatch = rawText.match(/<pre>(?:Error:\s*)?([\s\S]*?)<\/pre>/i);
        if (preMatch && preMatch[1]) {
          message = preMatch[1].split('<br')[0].split('\n')[0].trim();
        } else {
          const titleMatch = rawText.match(/<title>([\s\S]*?)<\/title>/i);
          if (titleMatch && titleMatch[1] && !titleMatch[1].toLowerCase().includes('error')) {
            message = titleMatch[1].trim();
          }
        }
      }

      // 3. Provide friendly contextual defaults based on HTTP status
      if (!message) {
        switch (response.status) {
          case 400:
            message = 'Invalid request. Please check your information and try again.';
            break;
          case 401:
            message = 'Please sign in to continue.';
            break;
          case 403:
            message = 'You do not have permission to perform this action.';
            break;
          case 404:
            message = 'The requested content could not be found.';
            break;
          case 409:
            message = 'A user or item with this information already exists.';
            break;
          case 429:
            message = 'The server is temporarily busy or waking up from sleep. Please wait a moment and try again.';
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            message = 'Server is currently experiencing an issue or waking up. Please try again shortly.';
            break;
          default:
            message = `Request could not be completed (Status ${response.status}).`;
        }
      }

      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data || {};
  } catch (error) {
    if (error.name === 'TypeError' && error.message.toLowerCase().includes('fetch')) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return request(endpoint, options, retries - 1);
      }
      const netErr = new Error('Unable to connect to the YouPlay server. Please check your network connection.');
      netErr.status = 0;
      throw netErr;
    }
    throw error;
  }
}

// User & Auth APIs
export const userApi = {
  register: (formData) => request('/users/register', { method: 'POST', body: formData }),
  login: (credentials) => request('/users/login', { method: 'POST', body: credentials }),
  logout: () => request('/users/logout', { method: 'POST' }),
  getCurrentUser: () => request('/users/current-user'),
  changePassword: (data) => request('/users/change-password', { method: 'POST', body: data }),
  updateAccount: (data) => request('/users/update-account', { method: 'PATCH', body: data }),
  updateAvatar: (formData) => request('/users/avatar', { method: 'PATCH', body: formData }),
  updateCoverImage: (formData) => request('/users/cover-image', { method: 'PATCH', body: formData }),
  getUserProfile: (username) => request(`/users/c/${username}`),
  getWatchHistory: () => request('/users/history'),
};

// Video APIs
export const videoApi = {
  getAllVideos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.query) query.append('query', params.query);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortType) query.append('sortType', params.sortType);
    if (params.userId) query.append('userId', params.userId);
    const qs = query.toString();
    return request(`/videos${qs ? `?${qs}` : ''}`);
  },
  getVideoById: (videoId) => request(`/videos/${videoId}`),
  publishVideo: (formData) => request('/videos', { method: 'POST', body: formData }),
  updateVideo: (videoId, formData) => request(`/videos/${videoId}`, { method: 'PATCH', body: formData }),
  deleteVideo: (videoId) => request(`/videos/${videoId}`, { method: 'DELETE' }),
  togglePublishStatus: (videoId) => request(`/videos/toggle/publish/${videoId}`, { method: 'PATCH' }),
};

// Comment APIs
export const commentApi = {
  getVideoComments: (videoId, page = 1, limit = 10) => 
    request(`/comments/${videoId}?page=${page}&limit=${limit}`),
  addComment: (videoId, content) => 
    request(`/comments/${videoId}`, { method: 'POST', body: { content } }),
  updateComment: (commentId, content) => 
    request(`/comments/c/${commentId}`, { method: 'PATCH', body: { content } }),
  deleteComment: (commentId) => 
    request(`/comments/c/${commentId}`, { method: 'DELETE' }),
};

// Like APIs
export const likeApi = {
  toggleVideoLike: (videoId) => request(`/likes/toggle/v/${videoId}`, { method: 'POST' }),
  toggleCommentLike: (commentId) => request(`/likes/toggle/c/${commentId}`, { method: 'POST' }),
  toggleTweetLike: (tweetId) => request(`/likes/toggle/t/${tweetId}`, { method: 'POST' }),
  getLikedVideos: () => request('/likes/videos'),
};

// Tweet APIs
export const tweetApi = {
  getAllTweets: () => request('/tweets'),
  createTweet: (content) => request('/tweets', { method: 'POST', body: { content } }),
  getUserTweets: (userId) => request(`/tweets/user/${userId}`),
  updateTweet: (tweetId, content) => request(`/tweets/${tweetId}`, { method: 'PATCH', body: { content } }),
  deleteTweet: (tweetId) => request(`/tweets/${tweetId}`, { method: 'DELETE' }),
};

// Subscription APIs
export const subscriptionApi = {
  toggleSubscription: (channelId) => request(`/subscriptions/c/${channelId}`, { method: 'POST' }),
  getChannelSubscribers: (channelId) => request(`/subscriptions/c/${channelId}`),
  getSubscribedChannels: (subscriberId) => request(`/subscriptions/u/${subscriberId}`),
};

// Playlist APIs
export const playlistApi = {
  createPlaylist: (name, description) => 
    request('/playlist', { method: 'POST', body: { name, description } }),
  getPlaylistById: (playlistId) => request(`/playlist/${playlistId}`),
  getUserPlaylists: (userId) => request(`/playlist/user/${userId}`),
  addVideoToPlaylist: (videoId, playlistId) => 
    request(`/playlist/add/${videoId}/${playlistId}`, { method: 'PATCH' }),
  removeVideoFromPlaylist: (videoId, playlistId) => 
    request(`/playlist/remove/${videoId}/${playlistId}`, { method: 'PATCH' }),
  deletePlaylist: (playlistId) => request(`/playlist/${playlistId}`, { method: 'DELETE' }),
  updatePlaylist: (playlistId, data) => 
    request(`/playlist/${playlistId}`, { method: 'PATCH', body: data }),
};

// Dashboard APIs
export const dashboardApi = {
  getStats: () => request('/dashboard/stats'),
  getVideos: () => request('/dashboard/videos'),
};
