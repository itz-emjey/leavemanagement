import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import {
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { message: 'Too many login attempts. Please try again after 15 minutes.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: { message: 'Too many password reset attempts. Please try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Multer config for profile picture uploads
const profileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = 'profile-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

router.post('/login', authLimiter, validate({ body: schemas.login }), login);
router.post('/logout', protect, logout);
router.post('/forgot-password', passwordResetLimiter, validate({ body: schemas.forgotPassword }), forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate({ body: schemas.resetPassword }), resetPassword);
router.post('/change-password', protect, validate({ body: schemas.changePassword }), changePassword);
router.get('/me', protect, getProfile);
router.put('/profile', protect, uploadProfile.single('profilePicture'), updateProfile);

export default router;
