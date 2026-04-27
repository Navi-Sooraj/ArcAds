import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Extract name without extension, replace spaces with underscores
    const originalName = path.parse(file.originalname || 'upload').name.replace(/\s+/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname || '').toLowerCase();
    // Convention: (original name + unique timestamp)
    cb(null, `${originalName}-${timestamp}${ext || '.jpg'}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos/large images
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'), false);
    }
  },
});
