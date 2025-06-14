import { NextFunction, Request, Response } from "express";
import { check, validationResult } from "express-validator";
import { deleteLocalFile } from "./multer.js";
export const auth = [
  check("username")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 30 })
    .withMessage("username should be 3-10 letters"),
  check("password")
    .trim()
    .notEmpty()
    .isLength({ min: 8, max: 20 })
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ).withMessage(
      "Password should be 8 to 20 letters, should have atleast one uppercase, one lowercase, one special character, one number"
    ),
  check("firstName")
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 30 })
    .withMessage("firstName should be 2-30 letters"),
];
export const edituser = [
  check("firstName")
    .trim()
    .notEmpty()
    .isLength({ min: 2, max: 30 })
    .withMessage("firstName should be 2-30 letters"),
];
export const logauth = [
  check("username")
    .trim()
    .notEmpty()
    .isLength({ min: 3, max: 30 })
    .withMessage("username should be 3-10 letters"),
  check("password")
    .trim()
    .notEmpty()
    .isLength({ min: 8, max: 20 })
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ).withMessage(
      "Password should be 8 to 20 letters, should have atleast one uppercase, one lowercase, one special character, one number"
    ),
];
export const validate = async(req: Request, res: Response, next: NextFunction):Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if(req.file){
        await deleteLocalFile(req.file.path)
      }
      const errorArray = errors.array();
       res.status(411).json({
         errors: errorArray,
         success:false,
         message:errorArray[errorArray.length - 1].msg
       });
       return
    }
    next()
  } catch (e) {
    console.log("validation", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return
  }
};
