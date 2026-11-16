    import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Uses memory storage to keep file in buffer (not saved to disk)
const storage = multer.memoryStorage();

// File filter to accept only PDF files
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'));
    }
};

// Create multer instance with configuration
export const uploadPdf = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size,
    }
});

export default uploadPdf;

// --- BRANDING LOGO UPLOAD ---
// Store in memory, upload to local disk (can be replaced with S3/Cloudinary later)
const logoUploadDir = path.join(__dirname, '../../uploads/partners');
if (!fs.existsSync(logoUploadDir)) {
    fs.mkdirSync(logoUploadDir, { recursive: true });
}

const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, logoUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `logo-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const imageFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Only JPEG, PNG, and SVG are allowed.'));
    }
};

export const uploadLogo = multer({
    storage: logoStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
    },
    fileFilter: imageFileFilter
});
