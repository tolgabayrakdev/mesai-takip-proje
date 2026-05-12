import bcrypt from 'bcrypt';
import { UserRepository } from '../repository/user.repository.js';
import { generateToken } from '../helper/jwt.helper.js';
import UnauthorizedException from '../exceptions/UnauthorizedException.js';

export class AuthService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(email, password) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email veya şifre hatalı');

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new UnauthorizedException('Email veya şifre hatalı');

    const token = generateToken({ id: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
