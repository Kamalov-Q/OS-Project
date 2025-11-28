import { extname } from 'path';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as process from 'process';
import { diskStorage } from 'multer';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const fileExt = extname(file.originalname);
    const name = randomBytes(8).toString('hex') + Date.now();
    cb(null, `${name}${fileExt}`);
  },
});
