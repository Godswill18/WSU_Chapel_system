import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Accept id in any of three common properties
    const userId = req.user?.userId || req.user?.id || req.user?._id;

    if (!userId) {
      return cb(new Error("Missing user ID on request object"), null);
    }

    // uploads/<userId>   (Backend/uploads if you need that prefix)
    const uploadPath = path.join("uploads/images/profileImg", String(userId));

    // Create the folder recursively if it doesn’t exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

export default multer({ storage });
