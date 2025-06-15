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
export const deleteFromCloudinary = async (url: string) => {
  try {
    const parts = url.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0]; 
    const folder = parts.slice(-2, -1)[0];
    const fullPublicId = `${folder}/${publicId}`;

    await cloudinary.uploader.destroy(fullPublicId);
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
  }
};

