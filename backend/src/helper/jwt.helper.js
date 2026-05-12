import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';

export function generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '3h' });
}

export function validateToken(token) {
    return jwt.verify(token, config.jwtSecret);
}
