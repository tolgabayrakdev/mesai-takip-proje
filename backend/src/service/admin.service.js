import { UserRepository } from '../repository/user.repository.js';
import { SessionRepository } from '../repository/session.repository.js';
import { EventRepository } from '../repository/event.repository.js';

export class AdminService {
  constructor() {
    this.userRepository = new UserRepository();
    this.sessionRepository = new SessionRepository();
    this.eventRepository = new EventRepository();
  }

  // Tüm aktif çalışanları bugünkü mesai durumlarıyla birlikte getirir.
  // Molada olan çalışanlar için anlık mola süresini de hesaplayıp toplam mola dakikasına ekler.
  async getEmployeeList() {
    const users = await this.userRepository.findAllActive();
    const todaySessions = await this.sessionRepository.findAllTodaySessions();

    const sessionMap = {};
    todaySessions.forEach((s) => { sessionMap[s.user_id] = s; });

    const result = await Promise.all(users.map(async (u) => {
      const session = sessionMap[u.id];
      let currentBreakMinutes = 0;
      if (session?.status === 'molada') {
        const lastBreakStart = await this.eventRepository.findLastEvent(session.id, 'mola_baslat');
        if (lastBreakStart) {
          currentBreakMinutes = Math.ceil((Date.now() - new Date(lastBreakStart.occurred_at).getTime()) / 60_000);
        }
      }
      return {
        ...u,
        todayStatus: session?.status || 'mesaiye_baslamadi',
        startedAt: session?.started_at || null,
        totalBreakMinutes: (session?.total_break_minutes || 0) + currentBreakMinutes,
      };
    }));

    return result;
  }

  // Belirli bir çalışanın profil bilgilerini ID'ye göre getirir.
  async getEmployee(userId) {
    return this.userRepository.findById(userId);
  }

  // Bir çalışanın mesai olay geçmişini belirtilen periyota göre getirir (varsayılan: günlük).
  async getEmployeeHistory(userId, period = 'daily') {
    return this.eventRepository.findEventsByPeriod(userId, period);
  }
}
