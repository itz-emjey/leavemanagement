import { Router } from 'express';
import { getLeaveCredits, adjustLeaveCredit, carryOverCredits, bulkAdjustLeaveCredits } from '../controllers/leaveCreditController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getLeaveCredits);
router.post('/adjust', adjustLeaveCredit);
router.post('/bulk-adjust', bulkAdjustLeaveCredits);
router.post('/carry-over', carryOverCredits);

export default router;
