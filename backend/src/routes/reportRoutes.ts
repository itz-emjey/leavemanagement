import { Router } from 'express';
import {
  getReportTrends,
  getReportLeaveTypeDistribution,
  getReportDepartmentComparison,
  getReportSummary,
  getReportExportCsv,
  getEmployeeLeaveStatement,
} from '../controllers/reportController';
import { protect } from '../middleware/auth';
import { authorizePermission } from '../middleware/rbac';

const router = Router();

router.use(protect);

router.get('/trends', authorizePermission('reports', 'read'), getReportTrends);
router.get('/leave-type-distribution', authorizePermission('reports', 'read'), getReportLeaveTypeDistribution);
router.get('/department-comparison', authorizePermission('reports', 'read'), getReportDepartmentComparison);
router.get('/summary', authorizePermission('reports', 'read'), getReportSummary);
router.get('/export-csv', authorizePermission('reports', 'export'), getReportExportCsv);
router.get('/employee-statement', authorizePermission('reports', 'read'), getEmployeeLeaveStatement);

export default router;
