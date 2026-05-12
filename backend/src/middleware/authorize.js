import HttpException from '../exceptions/HttpException.js';

export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(new HttpException(403, 'Bu işlem için yetkiniz yok'));
    }
    next();
  };
}
