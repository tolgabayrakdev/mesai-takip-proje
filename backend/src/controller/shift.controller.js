import { ShiftService } from '../service/shift.service.js';

export class ShiftController {
  constructor() {
    this.shiftService = new ShiftService();
  }

  startShift = async (req, res, next) => {
    try {
      const session = await this.shiftService.startShift(req.user.id);
      res.status(201).json(session);
    } catch (err) {
      next(err);
    }
  };

  startBreak = async (req, res, next) => {
    try {
      const session = await this.shiftService.startBreak(req.user.id);
      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  endBreak = async (req, res, next) => {
    try {
      const session = await this.shiftService.endBreak(req.user.id);
      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  endShift = async (req, res, next) => {
    try {
      const session = await this.shiftService.endShift(req.user.id);
      res.json(session);
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req, res, next) => {
    try {
      const events = await this.shiftService.getHistory(req.user.id);
      res.json(events);
    } catch (err) {
      next(err);
    }
  };
}
