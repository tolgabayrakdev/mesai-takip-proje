import { AuthService } from '../service/auth.service.js';
import { config } from '../config/environment.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.cookie('token', result.token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: 'lax',
        maxAge: 3 * 60 * 60 * 1000,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getMe = async (req, res, next) => {
    try {
      const user = await this.authService.getMe(req.user.id);
      res.json(user);
    } catch (err) {
      next(err);
    }
  };

  logout = (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Çıkış yapıldı' });
  };
}
