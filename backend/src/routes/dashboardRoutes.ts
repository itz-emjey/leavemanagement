import { Router } from 'express';
import { getAdminDashboard, getEmployeeDashboard } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/employee', protect, getEmployeeDashboard);

export default router;
