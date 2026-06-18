import { Router } from 'express';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';
import {
  getSystemConfig,
  updateSystemConfig,
  resetSystemConfig,
  getSystemHealth,
} from '../controllers/systemConfigController';

const router = Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getSystemConfig);
router.put('/', validate({ body: schemas.updateSystemConfig }), updateSystemConfig);
router.post('/reset', resetSystemConfig);
router.get('/health', getSystemHealth);

export default router;
