import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const uploadDir = path.resolve(process.cwd(), config.uploads.uploadDir || './uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized filename to prevent directory traversal or file execution
    const safeExt = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    cb(null, `doc-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const err: any = new Error(`File type '${file.mimetype}' is not permitted. Only PDF, JPG, and PNG are allowed.`);
    err.statusCode = 400;
    cb(err);
  }
};

export const documentUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.maxFileSizeBytes || 10 * 1024 * 1024, // 10MB max
  },
});
