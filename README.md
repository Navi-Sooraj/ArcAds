# ArcAds – Digitalizing the Unorganized Local Advertising Economy

Full-stack web app connecting **advertisers** with **space owners** (billboards, hoardings, digital screens). Built with React + Material UI + Node/Express + MySQL (Sequelize).

## Tech Stack

| Layer    | Stack |
|----------|--------|
| Frontend | React, Material UI, React Router, Axios |
| Backend  | Node.js, Express.js, MySQL, Sequelize ORM |
| Auth     | Simple email + password (no JWT, no hashing) |

## Folder Structure

```
ArcAds/
├── Backend/
│   ├── config/
│   │   ├── database.js    # Sequelize + MySQL connection
│   │   └── db.js          # Legacy raw mysql2 (optional)
│   ├── controllers/       # auth, adSpace, booking, partner, admin, review, notification
│   ├── models/            # User, AdSpace, Booking, Review, Notification
│   ├── routes/            # auth, adSpaces, bookings, partners, admin, reviews, notifications
│   ├── index.js           # Express app + DB sync
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.js   # Axios instance + X-User-Id
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   ├── pages/         # Landing, Login, Signup, Dashboards, Marketplace, etc.
│   │   ├── theme.js       # MUI theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js     # Proxy /api -> backend
│   └── package.json
└── README.md
```

## Setup

### 1. MySQL

- Create a database: `CREATE DATABASE arcads;`
- Use the same credentials in Backend `.env` (see `.env.example`).

### 2. Backend

```bash
cd Backend
cp .env.example .env
# Edit .env: DB_NAME=arcads, DB_USER=root, DB_PASSWORD=root, etc.
npm install
npm start
```

Server runs at `http://localhost:5000`. Tables are created on first run via Sequelize `sync()`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. Vite proxies `/api` to the backend.

### 4. Admin user (optional)

Auth uses plain email/password. To get an admin:

- Insert in MySQL:  
  `INSERT INTO Users (email, password, name, role, createdAt, updatedAt) VALUES ('admin@arcads.com', 'admin123', 'Admin', 'admin', NOW(), NOW());`
- Or add a seed script in Backend and run it once.

## API Overview

| Path | Description |
|------|-------------|
| `POST /api/auth/login` | Login (email, password) |
| `POST /api/auth/signup` | Signup (email, password, name, phone, role) |
| `GET /api/auth/me` | Current user (query/userId or X-User-Id) |
| `PUT /api/auth/profile` | Update name, phone (X-User-Id) |
| `GET /api/ad-spaces` | List approved spaces (filters: type, location, search) |
| `GET /api/ad-spaces/owner` | List spaces by ownerId |
| `GET /api/ad-spaces/:id` | Ad space details |
| `POST /api/ad-spaces` | Create (ownerId, title, type, pricePerDay, …) |
| `PUT /api/ad-spaces/:id` | Update |
| `DELETE /api/ad-spaces/:id` | Delete |
| `POST /api/bookings` | Create booking |
| `GET /api/bookings` | List (userId, role, adSpaceId, status) |
| `PATCH /api/bookings/:id/status` | Update status |
| `GET /api/partners` | List space owners |
| `GET /api/admin/dashboard` | Stats (admin) |
| `GET /api/admin/pending-spaces` | Spaces pending approval |
| `POST /api/admin/spaces/:id/approve` | Approve space |
| `POST /api/admin/spaces/:id/reject` | Reject space |
| `GET /api/reviews/ad-space/:adSpaceId` | Reviews for space |
| `POST /api/reviews` | Add review |
| `GET /api/notifications` | User notifications |

All authenticated requests send `X-User-Id: <userId>` (set by frontend from stored user).

## Modules

- **Landing** – Hero, value props, CTA to signup/login/marketplace.
- **Login / Signup** – Email + password; role: advertiser | space_owner (admin only via DB).
- **Advertiser Dashboard** – My bookings, link to marketplace.
- **Space Owner Dashboard** – My ad spaces, add space form, pending booking requests (confirm/reject).
- **Admin Dashboard** – Counts (users, spaces, bookings, pending), approve/reject spaces, user list.
- **Ad Space Marketplace** – List/filter spaces, link to details.
- **Ad Space Details** – Info, price, owner, reviews, “Book this space” (login if needed).
- **Booking** – Select dates, notes, submit; total = days × pricePerDay.
- **Profile** – View/edit name, phone (auth/profile).
- **AI Design Canvas** – UI-only placeholder for future AI ad design.

## Database Tables (Sequelize)

- **Users** – id, email, password, name, phone, role (advertiser | space_owner | admin), isActive.
- **AdSpaces** – id, ownerId, title, description, location, type, size, pricePerDay, images (JSON), isAvailable, isApproved.
- **Bookings** – id, advertiserId, adSpaceId, startDate, endDate, totalAmount, status, notes.
- **Reviews** – id, userId, adSpaceId, rating, comment.
- **Notifications** – id, userId, title, message, type, link, isRead.

All tables have `createdAt` / `updatedAt`. Foreign keys link Users ↔ AdSpaces ↔ Bookings ↔ Reviews ↔ Notifications as in `Backend/models/index.js`.

---

Each step (folder structure, server setup, MySQL connection, Sequelize config, models, routes, React structure, MUI theme, React Router) is implemented as described; run Backend and Frontend as above to use the app.
