import { validateToken } from "../helper/jwt.helper.js";
import { config } from "../config/environment.js";
import UnauthorizedException from "../exceptions/UnauthorizedException.js";

export function authenticate(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) throw new UnauthorizedException("Oturum bilgisi bulunamadı, lütfen giriş yapın");

    req.user = validateToken(token);
    next();
  } catch (err) {
    if (err instanceof UnauthorizedException) return next(err);
    next(
      new UnauthorizedException("Oturum süresi dolmuş veya geçersiz, lütfen tekrar giriş yapın")
    );
  }
}
