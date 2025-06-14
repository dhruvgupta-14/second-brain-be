import mongoose from "mongoose";
const shareSchema=new mongoose.Schema({
  link:{
    type:String,
    unique:true,
    required:true,
  },
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  }
  
},{timestamps:true})

const Share=mongoose.model('Share',shareSchema)
export default Share