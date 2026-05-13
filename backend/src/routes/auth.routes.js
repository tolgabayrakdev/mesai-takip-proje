import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controller/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
const authController = new AuthController();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { message: "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin." },
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post("/login", loginLimiter, validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);
router.post("/logout", authenticate, authController.logout);

export default router;
