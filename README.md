# 🏔️ Taakra 2026 — Backend API

The backend powering the **Taakra Competition Platform**, built with **Express.js**, **MongoDB**, and **Socket.io**.

<p align="center">
  <img src="../ui/public/logo.png" alt="Taakra Logo" width="200" />
</p>

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Create .env file (see Environment Variables below)

# Run in development mode
npm run dev

# Run in production mode
npm start
```

The server runs at `http://localhost:5000` by default.

---

## 🔑 Environment Variables

Create a `.env` file in the backend root:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Client URL (for CORS and OAuth redirects)
CLIENT_URL=http://localhost:3000

# AI Chatbot (optional — fallback responses work without this)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login with email/password |
| GET | `/api/auth/me` | Private | Get current user |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/google` | Public | Google OAuth login |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |

### Competitions
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/competitions` | Public | List all competitions (paginated, filterable) |
| GET | `/api/competitions/:id` | Public | Get competition details |
| POST | `/api/competitions` | Admin | Create a competition |
| PUT | `/api/competitions/:id` | Admin | Update a competition |
| DELETE | `/api/competitions/:id` | Admin | Delete a competition |
| POST | `/api/competitions/:id/register` | Private | Register for a competition |
| GET | `/api/competitions/:id/registrations` | Admin | Get all registrations |
| PATCH | `/api/competitions/:id/registrations/:userId` | Admin | Update registration status |

### Categories
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/categories` | Public | List all categories |
| POST | `/api/categories` | Admin | Create a category |
| PUT | `/api/categories/:id` | Admin | Update a category |
| DELETE | `/api/categories/:id` | Admin | Delete a category |

### Users
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/users/my-competitions` | Private | Get user's registered competitions |
| PUT | `/api/users/profile` | Private | Update profile (name, avatar) |
| PUT | `/api/users/change-password` | Private | Change password |
| GET | `/api/users` | Admin | Get all users |
| PUT | `/api/users/:id/role` | Admin | Update user role |
| DELETE | `/api/users/:id` | Admin | Delete a user |

### Chat
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/chat/rooms` | Admin/Support | List active chat rooms |
| GET | `/api/chat/:roomId` | Private | Get chat history (paginated) |

### AI Chatbot
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/chatbot/message` | Private | Send message to AI assistant |
| DELETE | `/api/chatbot/history` | Private | Clear conversation history |

---

## 🔌 Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client → Server | Join a chat room |
| `leaveRoom` | Client → Server | Leave a chat room |
| `sendMessage` | Client → Server | Send a message |
| `receiveMessage` | Server → Client | Receive a new message |
| `typing` | Client → Server | Send typing indicator |
| `userTyping` | Server → Client | Receive typing indicator |
| `markRead` | Client → Server | Mark messages as read |
| `messagesRead` | Server → Client | Messages read notification |
| `userOnline` | Server → Client | User came online |
| `userOffline` | Server → Client | User went offline |

---

## 🗂️ Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── passport.js        # Google OAuth strategy
│   ├── socket.js          # Socket.io setup with JWT auth
│   └── swagger.js         # Swagger/OpenAPI config
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── categoryController.js
│   ├── chatController.js  # Chat history & rooms
│   ├── chatbotController.js # AI chatbot (Gemini)
│   ├── competitionController.js
│   └── userController.js  # Profile & admin user mgmt
├── middleware/
│   └── auth.js            # JWT protect & role authorize
├── models/
│   ├── Category.js
│   ├── Competition.js
│   ├── Message.js         # Chat messages
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── categoryRoutes.js
│   ├── chatRoutes.js
│   ├── chatbotRoutes.js
│   ├── competitionRoutes.js
│   └── userRoutes.js
├── utils/
│   └── generateToken.js   # JWT token utilities
├── .env
├── package.json
└── server.js              # Entry point
```

---

## 🛡️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB (Mongoose 9)
- **Auth:** JWT + Google OAuth (Passport.js)
- **Real-Time:** Socket.io
- **AI:** Google Gemini API
- **Docs:** Swagger UI (`/api-docs`)
