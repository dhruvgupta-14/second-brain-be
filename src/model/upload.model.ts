import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true }, // file URLs or names
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Upload = mongoose.model('Upload', uploadSchema);
export default Upload
