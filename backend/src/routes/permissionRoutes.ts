import { Router } from 'express';
import {
  getPermissions,
  updatePermission,
  resetDefaultPermissions,
} from '../controllers/permissionController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getPermissions);
router.post('/', validate({ body: schemas.updatePermission }), updatePermission);
router.post('/reset', resetDefaultPermissions);

export default router;
