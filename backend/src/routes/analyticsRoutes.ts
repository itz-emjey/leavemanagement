import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import {
  getAnalyticsOverview,
  getAnalyticsTrends,
  getAnalyticsEmployees,
  getAnalyticsUtilization,
} from '../controllers/analyticsController';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/overview', getAnalyticsOverview);
router.get('/trends', getAnalyticsTrends);
router.get('/employees', getAnalyticsEmployees);
router.get('/utilization', getAnalyticsUtilization);

export default router;
