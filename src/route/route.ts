import express from "express"
import { auth, edituser, logauth, validate } from "../middleware/validation.middleware.js"
import { getMe, Login, Logout, Signup, updateUser } from "../controller/auth.js"
import { createContent, deleteContent, getAllContent, getOtherBrain, SearchContent, ShareLink } from "../controller/CRUD.js"
import { isLogin } from "../middleware/auth.middleware.js"
import { upload } from "../middleware/multer.js"
import { getConversations, getMessages, sendMessage } from "../controller/message.js"
const appRouter=express.Router()
appRouter.post('/signup',auth,validate,Signup )
appRouter.post('/login',logauth,validate,Login)
appRouter.get('/me',isLogin,getMe)
appRouter.put('/edit',isLogin,upload.single('avatar'),edituser,validate,updateUser)
appRouter.get('/logout',isLogin,Logout)
appRouter.post('/content',isLogin,createContent)
appRouter.post('/content/search',isLogin,SearchContent) 
appRouter.get('/content',isLogin,getAllContent)
appRouter.delete('/content/delete/:contentId',isLogin,deleteContent)
appRouter.post('/share',isLogin,ShareLink)
appRouter.post('/share/brain/:hash',getOtherBrain)
appRouter.post('/chat',isLogin,sendMessage)
appRouter.get('/conversation',isLogin,getConversations)
appRouter.get('/message/:otherUserId',isLogin,getMessages)

export default appRouter