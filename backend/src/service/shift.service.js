import { SessionRepository } from '../repository/session.repository.js';
import { EventRepository } from '../repository/event.repository.js';
import HttpException from '../exceptions/HttpException.js';

export class ShiftService {
  constructor() {
    this.sessionRepository = new SessionRepository();
    this.eventRepository = new EventRepository();
  }

  async startShift(userId) {
    const existing = await this.sessionRepository.findTodaySession(userId);
    if (existing) throw new HttpException(409, 'Bugün için zaten bir mesai kaydı var');

    const session = await this.sessionRepository.createSession(userId);
    await this.eventRepository.createEvent(session.id, userId, 'mesai_baslat');
    return session;
  }

  async startBreak(userId) {
    const session = await this.sessionRepository.findTodaySession(userId);
    if (!session) throw new HttpException(400, 'Aktif mesai bulunamadı');
    if (session.status !== 'mesaide') throw new HttpException(400, 'Molaya çıkmak için önce mesai başlatmalısınız');

    const updated = await this.sessionRepository.updateSessionStatus(session.id, 'molada');
    await this.eventRepository.createEvent(session.id, userId, 'mola_baslat');
    return updated;
  }

  async endBreak(userId) {
    const session = await this.sessionRepository.findTodaySession(userId);
    if (!session) throw new HttpException(400, 'Aktif mesai bulunamadı');
    if (session.status !== 'molada') throw new HttpException(400, 'Aktif bir mola bulunamadı');

    const lastBreakStart = await this.eventRepository.findLastEvent(session.id, 'mola_baslat');
    const breakMinutes = Math.round(
      (Date.now() - new Date(lastBreakStart.occurred_at).getTime()) / 60_000
    );

    await this.sessionRepository.addBreakMinutes(session.id, breakMinutes);
    const updated = await this.sessionRepository.updateSessionStatus(session.id, 'mesaide');
    await this.eventRepository.createEvent(session.id, userId, 'mola_bitis');
    return updated;
  }

  async endShift(userId) {
    const session = await this.sessionRepository.findTodaySession(userId);
    if (!session) throw new HttpException(400, 'Aktif mesai bulunamadı');
    if (session.status === 'molada') throw new HttpException(400, 'Moladan dönmeden mesayi bitiremezsiniz');
    if (session.status === 'mesai_bitti') throw new HttpException(400, 'Mesai zaten bitirilmiş');
    if (session.status !== 'mesaide') throw new HttpException(400, 'Aktif mesai bulunamadı');

    const updated = await this.sessionRepository.endSession(session.id);
    await this.eventRepository.createEvent(session.id, userId, 'mesai_bitir');
    return updated;
  }

  async getHistory(userId) {
    return this.eventRepository.findTodayEvents(userId);
  }
}
