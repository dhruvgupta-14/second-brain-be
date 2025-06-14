import { NextFunction, Request, Response } from "express";
import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import BlackListToken from "../model/blackListToken.js";
interface JwtPayload {
  id: string;
}
interface CustomRequest extends Request {
  user?: any; 
}
export async function isLogin(req: CustomRequest, res: Response,next:NextFunction):Promise<void> {
  const token = req.cookies.token;
  if (!token) {
    res.status(403).json({
      message: "Invalid Credentials",
      success: false,
    });
    return 
  }
  try {
    const find=await BlackListToken.findOne({ token });
    if (find) {
      res.status(403).json({
        message: "Invalid Credentials",
        success: false,
      });
      return
    }
    if (process.env.JWT_SECRET) {
      const decode = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
      const findUser = await User.findById(decode.id);
      if (!findUser) {
       res.status(403).json({
        message: "Invalid Credentials",
        success: false,
      });
      return
    }
    req.user=findUser
    next()
  } 
  } catch (e) {
    console.log("token e", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return 
  }
}
