import { Router } from 'express';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
} from '../controllers/leaveTypeController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getLeaveTypes);
router.post('/', authorize('admin'), validate({ body: schemas.createLeaveType }), createLeaveType);
router.put('/:id', authorize('admin'), validate({ body: schemas.updateLeaveType }), updateLeaveType);
router.delete('/:id', authorize('admin'), deleteLeaveType);

export default router;
