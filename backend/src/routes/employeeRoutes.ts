import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  resetEmployeePassword,
  bulkImportEmployees,
} from '../controllers/employeeController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate, schemas } from '../middleware/validate';

const router = Router();

// Multer config for CSV upload
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (_req, file, cb) => {
    cb(null, 'import-' + Date.now() + path.extname(file.originalname));
  },
});
const uploadCsv = multer({
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed.'));
    }
  },
});

router.use(protect);

router.get('/', authorize('admin', 'manager'), getEmployees);
router.get('/:id', authorize('admin', 'manager'), getEmployee);
router.post('/', authorize('admin'), validate({ body: schemas.createEmployee }), createEmployee);
router.post('/import', authorize('admin'), uploadCsv.single('file'), bulkImportEmployees);
router.put('/:id', authorize('admin'), validate({ body: schemas.updateEmployee }), updateEmployee);
router.delete('/:id', authorize('admin'), deleteEmployee);
router.patch('/:id/toggle-status', authorize('admin'), toggleEmployeeStatus);
router.post('/:id/reset-password', authorize('admin'), resetEmployeePassword);

export default router;
