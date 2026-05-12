import { AdminService } from '../service/admin.service.js';

export class AdminController {
  constructor() {
    this.adminService = new AdminService();
  }

  getEmployeeList = async (req, res, next) => {
    try {
      const employees = await this.adminService.getEmployeeList();
      res.json(employees);
    } catch (err) {
      next(err);
    }
  };

  getEmployeeHistory = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { period = 'daily' } = req.query;
      const events = await this.adminService.getEmployeeHistory(Number(id), period);
      res.json(events);
    } catch (err) {
      next(err);
    }
  };
}
