import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/environment.js';

export function generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '3h' });
}

export function validateToken(token, secret) {
    return jwt.verify(token, secret);
}
