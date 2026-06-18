import { Router } from 'express';
import {
  getApprovalsForRequest,
  createApproval,
  updateApproval,
  deleteApproval,
} from '../controllers/leaveRequestApprovalController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(protect);

router.get('/:leaveRequestId', getApprovalsForRequest);
router.post('/', authorize('admin'), createApproval);
router.patch('/:id', updateApproval);
router.delete('/:id', authorize('admin'), deleteApproval);

export default router;
