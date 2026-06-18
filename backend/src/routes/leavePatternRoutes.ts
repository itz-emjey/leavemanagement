import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';
import {
  getLeavePatterns,
  previewDates,
  createLeavePattern,
  generateFromPattern,
  updateLeavePattern,
  deleteLeavePattern,
} from '../controllers/leavePatternController';

const router = Router();

router.use(protect);

router.get('/', getLeavePatterns);
router.get('/preview', previewDates);
router.post('/', validate({ body: schemas.createLeavePattern }), createLeavePattern);
router.post('/:id/generate', generateFromPattern);
router.patch('/:id', validate({ body: schemas.updateLeavePattern }), updateLeavePattern);
router.delete('/:id', authorize('admin'), deleteLeavePattern);

export default router;
