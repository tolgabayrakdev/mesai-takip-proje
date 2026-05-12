import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { AdminController } from '../controller/admin.controller.js';

const router = Router();
const adminController = new AdminController();

router.use(authenticate, authorize('yonetici'));

router.get('/employees', adminController.getEmployeeList);
router.get('/employees/:id/history', adminController.getEmployeeHistory);

export default router;
