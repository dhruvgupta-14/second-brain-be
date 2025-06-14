import mongoose from "mongoose";
const blackListTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
});
const BlackListToken = mongoose.model("BlackListToken", blackListTokenSchema);
export default BlackListToken;
