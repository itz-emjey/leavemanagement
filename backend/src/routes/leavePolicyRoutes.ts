import { Router } from 'express';
import {
  getLeavePolicies,
  getLeavePolicy,
  createLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy,
} from '../controllers/leavePolicyController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getLeavePolicies);
router.get('/:id', getLeavePolicy);
router.post('/', authorize('admin'), validate({ body: schemas.createLeavePolicy }), createLeavePolicy);
router.put('/:id', authorize('admin'), validate({ body: schemas.updateLeavePolicy }), updateLeavePolicy);
router.delete('/:id', authorize('admin'), deleteLeavePolicy);

export default router;
