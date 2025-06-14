import mongoose from "mongoose";
const contentSchema=new mongoose.Schema({
  title:{
    type:String,
    required:true,
  },
  link:{
    type:String,
    required:true,
  },
  contentType:{
    type:String,
    enum:['image', 'youtube', 'tweet', 'instagram','doc'],
    required:true,
  },
  tags:{
    type:[mongoose.Schema.Types.ObjectId],
    ref:'Tag'
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  }
  
},{timestamps:true})

const Content=mongoose.model('Content',contentSchema)
export default Content