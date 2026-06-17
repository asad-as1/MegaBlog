# MegaBlog (MERN)

MegaBlog ek full-stack Blogging Application hai jisme users can:
- Register/Login + Auth
- Create/Edit/Delete Posts (media upload ke saath)
- Like/Unlike, Comment, Search
- Follow/Unfollow users
- Favorites (saved posts)
- Notifications (like/comment/follow)
- Notifications ko read/unread manage

---

## Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT authentication (access token + refresh token cookie flow)
- Cloudinary (image/video upload)
- Multer (buffer-based upload to Cloudinary)

### Frontend
- React + Vite
- TailwindCSS
- Axios
- cookies-js (token storage)

---

## Project Structure

```
Web Backend/MegaBlog/
  backend/
    app.js
    src/
      config/
        cloudinary.js
      controllers/
        post.controller.js
        user.controller.js
        media.controller.js
        notification.controller.js
      middlewares/
        auth.js
        upload.js
      models/
        post.js
        user.js
        notification.js
      router/
        post.routes.js
        user.routes.js
        media.routes.js
        notification.routes.js
      utils/
        notification.js
  frontend/
    src/
      pages/
        Home.jsx
        SinglePost.jsx
        Favourites.jsx
        FollowersList.jsx
        Notifications.jsx
        Search.jsx
        Profile.jsx
        ...
      components/
        PostCard.jsx
        Header.jsx
        ...
      api/
        auth.js
        media.js
```

---

## Backend API (Main Routes)

> Base path: `backend` uses mounts like `/user`, `/post`, `/media`, `/notifications`.

### Auth (User)
- `POST /user/register`
- `POST /user/login`
- `POST /user/refresh-token`
- `POST /user/logout`
- `GET /user/check-auth` (auth-protected)

### Posts
- `POST /post/newPost` (auth-protected)
- `GET /post/allPosts?page=1&limit=9`  ✅ Pagination
- `GET /post/search?query=...` (auth-protected)
- `GET /post/:postId` (auth-protected)
- `PUT /post/:postId` (auth-protected)
- `DELETE /post/:postId` (auth-protected)

### Likes
- `POST /post/:postId/like`
- `POST /post/:postId/unlike`
- `GET /post/:postId/likes`

### Comments
- `POST /post/:postId/comment`
- `DELETE /post/:postId/comment/:commentId`
- `GET /post/:postId/comments`

### Post Visibility (Admin)
- `PATCH /post/:postId/visibility` (admin-only; Public/Private)

### Media (Cloudinary)
- `POST /media/upload` (multipart upload to Cloudinary)
- `DELETE /media` (body: `publicId`, `resourceType`)

### Notifications
- `GET /notifications` (page/limit support)
- `GET /notifications/unread-count`
- `PATCH /notifications/read-all`
- `PATCH /notifications/:id/read`

### Favorites
Favorites related endpoints user routes me:
- `GET /user/favourites`
- `GET /user/favourites/check/:postId`
- `POST /user/favourites/:postId`
- `DELETE /user/favourites/:postId`

---

## Database Models (Schemas)

### User (`models/user.js`)
- `username` (unique)
- `email` (unique)
- `password` (bcrypt hashed)
- `bio`
- `profilePicture` + `profilePicturePublicId`
- `role`: `user | admin`
- `posts`: authored post ids
- `favourites`: saved post ids
- `followers`, `following`: user relationships

### Post (`models/post.js`)
- `title`, `content`
- `media`: { url, publicId, resourceType (image/video), isVideo }
- `author` (ref User)
- `categories[]`
- `likes[]` (ref User)
- `comments[]`: { user(ref), comment, createdAt }
- `isPublished`: `Public | Private | Scheduled`
- `scheduledAt` (date)
- `createdAt/updatedAt`

### Notification (`models/notification.js`)
- `recipient` (User)
- `sender` (User)
- `type`: `like | comment | follow`
- `post` (optional)
- `comment` (optional)
- `isRead`

---

## Pagination (Home Feed)

### Backend logic
`backend/src/controllers/post.controller.js` -> `getAllPosts`
- `page` default: 1
- `limit` default: 9
- `skip = (page-1)*limit`
- `totalPages = ceil(total/limit)`

### Response
Backend returns:
- `posts`
- `page`
- `limit`
- `totalPages`

### Frontend logic
`frontend/src/pages/Home.jsx`
- `page` state set hota hai
- page change pe API call hoti hai
- `window.scrollTo({ top: 0 })` pagination ke saath added hai (scroll-jump/bottom issue fix)

---

## Run Instructions

### Backend
1. `cd Web\ Backend/MegaBlog/backend`
2. `npm install`
3. `.env` set karein (ATLASDB_URL, SECRET, REFRESH_SECRET, CLOUDINARY vars, CORS_ORIGIN)
4. `npm start`

### Frontend
1. `cd Web\ Backend/MegaBlog/frontend`
2. `npm install`
3. `npm run dev`

---

## Notes / Known Points
- Auth middleware and cookie/header flow ko ensure karein ke frontend access token header bhej raha ho.
- Favorites route me GET side-effects prevent karna best practice hota hai.

---

## Files Mentioned for Reference
- `backend/src/controllers/post.controller.js` (pagination + posts)
- `backend/src/router/post.routes.js` (routes)
- `frontend/src/pages/Home.jsx` (pagination UI + fetch)

