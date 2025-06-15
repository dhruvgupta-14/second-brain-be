import { Request, Response } from "express";
import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BlackListToken from "../model/blackListToken.js";
import { deleteLocalFile } from "../middleware/multer.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../util/cloudinary.js";
interface CustomRequest extends Request {
  user?: any;
}
export async function Signup(req: Request, res: Response): Promise<void> {
  const { username, password ,firstName} = req.body;
  try {
    const findUser = await User.findOne({ username });
    if (findUser) {
      res.status(403).json({
        message: "User already exists with this username",
        success: false,
      });
      return;
    }
    const hashPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashPassword,
      firstName,
    });
    res.status(200).json({
      message: "User Signed Up",
      success: true,
    });
    return;
  } catch (e) {
    console.log("sign up e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}
export async function Login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  try {
    const findUser = await User.findOne({ username });
    if (!findUser) {
      res.status(403).json({
        message: "Invalid Credentials",
        success: false,
      });
      return;
    }
    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      res.status(403).json({
        message: "Invalid Credentials",
        success: false,
      });
      return;
    }
    if (process.env.JWT_SECRET) {
      const token = jwt.sign({ id: findUser._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure:true, // secure: false, Localhost is not HTTPS
        sameSite: "lax", // Allows cookies to be sent on GET/POST from different port
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        message: `Welcome ${findUser.username}`,
        success: true,
      });
      return;
    }
  } catch (e) {
    console.log("login e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function getMe(req: CustomRequest, res: Response): Promise<void> {
  const user = req.user;
  try {
    res.status(200).json({
      success: true,
      username: user.username,
      firstName: user.firstName,
      avatar:user.avatar,
      userId:user._id
    });
  } catch (e) {
    console.log("get me e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function updateUser(req: CustomRequest, res: Response): Promise<void> {
  const user = req.user;
  const { firstName} = req.body;
  try {
     const findUser = await User.findOne({ username: user.username });
    if (!findUser) {
      if (req.file) {
        await deleteLocalFile(req.file.path);
      }
      res.status(404).json({
        message: "User not found",
        success: false,
      });
      return;
    }
    const originalAvatar = findUser.avatar;
    let newAvatarUrl = originalAvatar;
    if(req.file){
      console.log("uploading start")
      newAvatarUrl=await uploadToCloudinary(req.file.path);
      // console.log(newAvatarUrl)
      if (originalAvatar) {
        await deleteFromCloudinary(originalAvatar);
      }
      await deleteLocalFile(req.file.path);
    }
    findUser.firstName=firstName
    findUser.avatar=newAvatarUrl||originalAvatar
    await findUser.save()
    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (e) {
    console.log("update user e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    if(req.file) await deleteLocalFile(req.file.path);
    return;
  }
}

export async function Logout(req: CustomRequest, res: Response): Promise<void> {
  const token = req.cookies.token;
  if (!token) {
    res.status(403).json({
      message: "Invalid Credentials",
      success: false,
    });
    return;
  }
  try {
    await BlackListToken.create({ token });
    res.clearCookie("token");
    res.status(200).json({
      message: "Logged out successfully",
      success: true,
    });
  } catch (e) {
    console.log("logout e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}
