import express from "express"
import { auth, edituser, logauth, validate } from "../middleware/validation.middleware.js"
import { getMe, Login, Logout, Signup, updateUser } from "../controller/auth.js"
import { createContent, createNote, deleteContent, deleteNote, deleteUpload, getAllContent, getOtherBrain, SearchContent, ShareLink, uploadFile } from "../controller/CRUD.js"
import { isLogin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/multer.js"
import { getConversations, getMessages, sendMessage } from "../controller/message.js"
import { askAI, suggestTitle } from "../util/ai.js"
const appRouter=express.Router()

// Auth Routes
appRouter.post('/signup', auth, validate, Signup);
appRouter.post('/login', logauth, validate, Login);
appRouter.get('/me', isLogin, getMe);
appRouter.put('/edit', isLogin, upload.single('avatar'), edituser, validate, updateUser);
appRouter.get('/logout', isLogin, Logout);

// Content (Link)
appRouter.post('/content', isLogin, createContent);
appRouter.get('/content', isLogin, getAllContent); // returns all (link + note + upload)
appRouter.post('/content/search', isLogin, SearchContent);
appRouter.delete('/content/delete/:contentId', isLogin, deleteContent);

// Note
appRouter.post('/note', isLogin, createNote);
appRouter.delete('/note/delete/:noteId', isLogin, deleteNote);

// Upload
appRouter.post('/upload', isLogin, upload.single("file"), uploadFile);
appRouter.delete('/upload/delete/:uploadId', isLogin, deleteUpload);

// Sharing
appRouter.post('/share', isLogin, ShareLink);
appRouter.post('/share/brain/:hash', getOtherBrain);

// Chat & Messaging
appRouter.post('/chat', isLogin, sendMessage);
appRouter.get('/conversation', isLogin, getConversations);
appRouter.get('/message/:otherUserId', isLogin, getMessages);

// appRouter.get('/ai',testAI)
appRouter.post('/ask/ai',isLogin,askAI)
appRouter.post('/ask/ai/title',isLogin,suggestTitle)

export default appRouter