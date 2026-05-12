import HttpException from './HttpException.js';

export default class ValidationException extends HttpException {
  constructor(message) {
    super(400, message);
  }
}
