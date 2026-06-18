import { Router } from 'express';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getUpcomingHolidays,
} from '../controllers/holidayController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getHolidays);
router.get('/upcoming', getUpcomingHolidays);
router.post('/', authorize('admin'), validate({ body: schemas.createHoliday }), createHoliday);
router.put('/:id', authorize('admin'), validate({ body: schemas.updateHoliday }), updateHoliday);
router.delete('/:id', authorize('admin'), deleteHoliday);

export default router;
