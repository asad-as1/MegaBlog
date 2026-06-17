# MegaBlog Pagination - Create/Read Checklist

## Backend (Express + Mongoose)

### 1) Pagination query params
Ensure controller reads:
- `page` (default 1)
- `limit` (default 9)

### 2) `skip` / `limit`
- `skip = (page - 1) * limit`
- `find(...).skip(skip).limit(limit)`

### 3) Total count for totalPages
- `total = Model.countDocuments(filter)`
- `totalPages = Math.ceil(total / limit)`

### 4) Response shape
Return at least:
- `posts`
- `page`
- `limit`
- `totalPages`

### 5) Route mapping
Make sure frontend endpoint matches backend route.
Example used in this project:
- `GET /post/allPosts?page=...&limit=...`

---

## Frontend (React)

### 1) State
- `page`
- `limit`
- `posts`
- `totalPages`

### 2) API call on page change
Use `useEffect` with dependency `[page, limit]`.

### 3) UI controls
- Prev / Next buttons
- Page number buttons

### 4) Scroll behavior (optional but recommended)
When `page` changes, reset scroll to top:
- `window.scrollTo({ top: 0, behavior: 'instant' })`

---

## MegaBlog: Files to refer
- Backend controller: `backend/src/controllers/post.controller.js`
- Backend routes: `backend/src/router/post.routes.js`
- Frontend home page: `frontend/src/pages/Home.jsx`

