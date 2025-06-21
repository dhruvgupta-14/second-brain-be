import multer from "multer";
import path from "path";
import fs from "fs"

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"));
  }
};
// fieldname is "document".
// If you use upload.single("document"), multer will handle this file.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/temp');
  },
  filename: function (req: any, file, cb) {
    const uniqueSuffix = `${Date.now()}-${req?.user?.username || "anon"}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname); // preserves extension
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024 // 4MB max per file
  }
});

export const deleteLocalFile = async (filePath: string): Promise<void> => {
  try {
    await fs.promises.unlink(filePath);
    console.log(`Local file deleted: ${filePath}`);
  } catch (error) {
    console.error(`Error deleting local file: ${error}`);
  }
};

