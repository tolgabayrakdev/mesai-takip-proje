import HttpException from '../exceptions/HttpException.js';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const statusCode = err instanceof HttpException ? err.statusCode : 500;
  const message = err instanceof HttpException ? err.message : 'Internal Server Error';

  res.status(statusCode).json({ statusCode, message });
}
