import { Router } from 'express';
import { AuthController } from '../controller/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../schemas/auth.schema.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();
const authController = new AuthController();

router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

export default router;
