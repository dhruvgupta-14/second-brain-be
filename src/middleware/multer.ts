import multer from "multer";
import fs from "fs"
import path from "path";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/temp')
  },
  filename: function (req:any, file, cb) {
    const uniqueSuffix = Date.now() + '-' +req.user.username+Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname); // Get extension like .jpg, .png
    cb(null, file.fieldname + '-' + uniqueSuffix+ext)
  }
})
export const deleteLocalFile = async (filePath: string): Promise<void> => {
  try {
  fs.unlink(filePath,()=>{
      console.log(filePath+" deleting starting")
    });
    console.log(`Local file deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting local file: ${error}`);
  }
};

export const upload = multer({ storage: storage })