import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.use(protect);

router.get('/', getDepartments);
router.post('/', authorize('admin'), validate({ body: schemas.createDepartment }), createDepartment);
router.put('/:id', authorize('admin'), validate({ body: schemas.updateDepartment }), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

export default router;
