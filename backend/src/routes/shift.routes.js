import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { ShiftController } from '../controller/shift.controller.js';

const router = Router();
const shiftController = new ShiftController();

router.use(authenticate);

router.post('/start', shiftController.startShift);
router.post('/break/start', shiftController.startBreak);
router.post('/break/end', shiftController.endBreak);
router.post('/end', shiftController.endShift);
router.get('/history', shiftController.getHistory);

export default router;
