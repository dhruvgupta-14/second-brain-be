import {v2 as cloudinary} from "cloudinary"
import { configDotenv } from "dotenv";
configDotenv()
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET ,
});

export const uploadToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'uploads', 
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    console.log(error)
    return ""
  }
};


