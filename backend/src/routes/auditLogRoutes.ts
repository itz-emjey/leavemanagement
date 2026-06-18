import { Router } from 'express';
import { getAuditLogs, getAuditLogActions, exportAuditLogs } from '../controllers/auditLogController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/', getAuditLogs);
router.get('/actions', getAuditLogActions);
router.get('/export', exportAuditLogs);

export default router;
