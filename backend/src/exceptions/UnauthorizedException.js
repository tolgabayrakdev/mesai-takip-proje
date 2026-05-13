import HttpException from "./HttpException.js";

export default class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}
