import express from "express";
import {config} from "dotenv"
import mongoose from "mongoose";
import http from "http"
import cors from "cors"
import cookieParser from "cookie-parser";
import appRouter from "./route/route.js";
import { setupWebSocket } from "./ws.js";
config()
const app= express()
const server=http.createServer(app)
app.use(cors({
  credentials:true,
  // origin:"https://second-brain-fe-five.vercel.app"
  origin:"http://localhost:5173"
}))
app.use(cookieParser())
app.use(express.json())
app.use('/api/v1',appRouter)
const dbConnect=async()=>{
  try{
   if(process.env.MONGODB_URL) {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log('mongodb Connected')
   }
  }catch(e){
    console.log('mongoDb error',e)
  }
}
const startServer=async()=>{
  await dbConnect()
  setupWebSocket(server)
  server.listen(process.env.PORT,async()=>{
  console.log(`Server is running at ${process.env.PORT}`)
})
}
startServer()

