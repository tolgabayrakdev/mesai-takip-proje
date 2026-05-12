import { UserRepository } from '../repository/user.repository.js';
import { SessionRepository } from '../repository/session.repository.js';
import { EventRepository } from '../repository/event.repository.js';

export class AdminService {
  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.eventRepository = new EventRepository();
  }

  async getEmployeeList() {
    const users = await this.userRepository.findAllActive();
    const todaySessions = await this.sessionRepository.findAllTodaySessions();

    const sessionMap = {};
    todaySessions.forEach((s) => { sessionMap[s.user_id] = s; });

    return users.map((u) => ({
      ...u,
      todayStatus: sessionMap[u.id]?.status || 'mesaiye_baslamadi',
      startedAt: sessionMap[u.id]?.started_at || null,
      totalBreakMinutes: sessionMap[u.id]?.total_break_minutes || 0,
    }));
  }

  async getEmployeeHistory(userId, period = 'daily') {
    return this.eventRepository.findEventsByPeriod(userId, period);
  }
}
