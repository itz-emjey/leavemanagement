import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveRequestCalendar,
  levelApproveLeaveRequest,
} from '../controllers/leaveRequestController';
import { protect } from '../middleware/auth';
import { authorizePermission } from '../middleware/rbac';

const router = Router();

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'));
    }
  },
});

router.use(protect);

router.get('/', getLeaveRequests);
router.post('/', upload.single('attachment'), createLeaveRequest);
router.patch('/:id/approve', authorizePermission('leave_requests', 'approve'), approveLeaveRequest);
router.patch('/:id/reject', authorizePermission('leave_requests', 'reject'), rejectLeaveRequest);
router.patch('/:id/cancel', authorizePermission('leave_requests', 'cancel'), cancelLeaveRequest);
router.patch('/:id/level-approve', levelApproveLeaveRequest);
router.get('/calendar', getLeaveRequestCalendar);

export default router;
