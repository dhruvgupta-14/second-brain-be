# 📦 PasteDrop Backend API

**PasteDrop** is the backend of a productivity-focused web application designed to solve a common user behavior: saving important links or notes in personal WhatsApp messages. This project replaces that inefficient approach with a seamless, organized, and searchable storage solution.

---

## 🔍 Problem It Solves

Many users save content like YouTube links, tweets, documents, or important notes by forwarding them to themselves via messaging apps like WhatsApp. This becomes unmanageable over time due to the lack of structure and poor search capabilities.

**PasteDrop** solves this by offering:

- Organized storage of various content types.
- Fast and intelligent search using semantic understanding.
- Basic real-time chat between users.

---

## 🚀 Key Features

### 📄 Content Storage

Users can create and store content with different formats:
- ✅ Text Notes / Docs
- ✅ YouTube Links
- ✅ Images
- ✅ Tweets
- ✅ Instagram Links

All entries are persistently stored and easily retrievable through APIs.

---

### 🔍 Semantic Search (Powered by Pinecone)

Traditional keyword-based search becomes inefficient as content volume increases. To address this, we implement **semantic search** using [Pinecone](https://www.pinecone.io/), allowing users to search based on **meaning**, not just words.

> Example: Searching for "React JS tutorial" will also fetch related content like “Learn React”, “JSX basics”, etc.

---

### 💬 Real-time Chat (WebSocket)

Users can interact with each other via real-time messaging. Current chat features include:
- One-to-one messaging
- Text-based communication
- WebSocket (`ws`) powered for real-time updates

> *Note: Chat functionality is minimal for now. Group chat, media messaging, and message status are planned for future versions.*

---

### 👤 Authentication & User Management

Secure and robust user system built using modern authentication standards:

- 🔐 JWT-based login and session management
- 🔏 Password encryption using **bcryptjs**
- ✅ Form validation using **express-validator**
- 🖼️ Profile picture support using **Multer + Cloudinary**
- 📝 Endpoints:
  - Sign up
  - Login
  - Logout
  - Fetch Profile
  - Update Profile

---

## ⚙️ Tech Stack

- **Backend Framework**: Node.js + Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT, bcryptjs, cookie-parser
- **Validation**: express-validator
- **File Upload**: multer + cloudinary
- **Semantic Search**: Pinecone Vector Database
- **Real-time Communication**: WebSocket (via `ws` library)

---



