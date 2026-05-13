import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Coffee,
  CalendarDays,
  Clock,
  Play,
  Square,
  FileDown,
  Sheet,
} from "lucide-react";
import { API_URL } from "@/lib/config";
import { exportAdminPdf, exportAdminCsv } from "@/lib/export-admin";
import type { HistoryEntry } from "@/lib/export-admin";

type Period = "daily" | "weekly" | "monthly";
type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";

const EVENT_LABELS: Record<EventType, string> = {
  mesai_baslat: "Mesai Başlatıldı",
  mola_baslat: "Molaya Çıkıldı",
  mola_bitis: "Moladan Dönüldü",
  mesai_bitir: "Mesai Bitirildi",
};

const EVENT_DOT: Record<EventType, string> = {
  mesai_baslat: "bg-green-500",
  mola_baslat: "bg-amber-400",
  mola_bitis: "bg-amber-400",
  mesai_bitir: "bg-blue-500",
};

const EVENT_ICON: Record<EventType, typeof Play> = {
  mesai_baslat: Play,
  mola_baslat: Coffee,
  mola_bitis: Clock,
  mesai_bitir: Square,
};

const PERIODS: { key: Period; label: string; desc: string }[] = [
  { key: "daily", label: "Bugün", desc: "Bugünkü kayıtlar" },
  { key: "weekly", label: "Haftalık", desc: "Son 7 gün" },
  { key: "monthly", label: "Aylık", desc: "Son 30 gün" },
];

// ISO tarih stringini "HH:MM" formatına çevirir; null gelirse "—" döner
function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// "YYYY-MM-DD" formatındaki tarihi okunabilir Türkçe metne çevirir.
// Bugün/dün ise kısa etiket, aksi hâlde "Pazartesi, 12 Mayıs" gibi uzun format döner.
// Saat bilgisi olmayan string'e T12:00:00 eklenir; böylece saat dilimi kayması önlenir.
function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Bugün";
  if (d.toDateString() === yesterday.toDateString()) return "Dün";

  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Mesai başlangıcı ile bitişi arasındaki süreyi hesaplar, toplam mola süresini düşer.
// Mesai henüz bitmemişse (session_ended null) veya net süre 0'ın altındaysa null döner.
// Sonucu "Xs Ydk" veya "Ydk" formatında döner (örn: "7s 30dk", "45dk").
function calcWorkMinutes(
  session_started: string,
  session_ended: string | null,
  total_break_minutes: number
) {
  if (!session_ended) return null;
  const ms = new Date(session_ended).getTime() - new Date(session_started).getTime();
  const total = Math.round(ms / 60_000) - total_break_minutes;
  if (total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}

export default function AdminHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [employeeName, setEmployeeName] = useState<string>("");
  const [period, setPeriod] = useState<Period>("daily");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında personelin adını çeker; hata/yetkisiz durumda admin paneline yönlendirir
  useEffect(() => {
    fetch(`${API_URL}/admin/employees/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) navigate("/admin");
        return res.json();
      })
      .then((data) => setEmployeeName(data.full_name ?? "Personel"))
      .catch(() => navigate("/admin"));
  }, [id, navigate]);

  // Seçili periyot (günlük/haftalık/aylık) değiştiğinde geçmişi yeniden çeker
  useEffect(() => {
    fetch(`${API_URL}/admin/employees/${id}/history?period=${period}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [id, period]);

  // Kayıtları tarihe göre gruplar: { "2025-05-12": [entry, ...], ... }
  // Her gün için olaylar en yeniden eskiye doğru sıralanır
  const grouped = history.reduce<Record<string, HistoryEntry[]>>((acc, e) => {
    const day = e.date.slice(0, 10);
    (acc[day] ??= []).push(e);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const activePeriod = PERIODS.find((p) => p.key === period)!;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Başlık */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{employeeName || "—"}</h1>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarDays className="h-3 w-3" />
            Hareket Geçmişi
          </p>
        </div>
      </div>

      {/* Periyot seçici + export butonları */}
      <div className="space-y-2">
        <div className="bg-muted grid grid-cols-3 gap-2 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`relative rounded-lg py-2.5 text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="block">{p.label}</span>
              <span
                className={`mt-0.5 block text-xs font-normal ${period === p.key ? "text-muted-foreground" : "text-muted-foreground/60"}`}
              >
                {p.desc}
              </span>
            </button>
          ))}
        </div>

        {history.length > 0 && (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => exportAdminCsv(employeeName, period, history)}
              className="bg-card text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Sheet className="h-3.5 w-3.5" />
              CSV İndir
            </button>
            <button
              onClick={() => exportAdminPdf(employeeName, period, history)}
              className="bg-card text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF İndir
            </button>
          </div>
        )}
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        </div>
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <CalendarDays className="text-muted-foreground/40 h-8 w-8" />
          <p className="text-muted-foreground text-sm font-medium">Kayıt bulunamadı</p>
          <p className="text-muted-foreground/60 text-xs">
            {activePeriod.desc} için herhangi bir işlem yapılmamış
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => {
            const entries = grouped[day];
            const first = entries[0];
            const hadBreak = entries.some((e) => e.event_type === "mola_baslat");
            const breakLabel =
              first.total_break_minutes > 0
                ? `${first.total_break_minutes} dk`
                : hadBreak
                  ? "< 1 dk"
                  : null;
            const workTime = calcWorkMinutes(
              first.session_started,
              first.session_ended,
              first.total_break_minutes
            );

            return (
              <div key={day} className="bg-card overflow-hidden rounded-xl border">
                {/* Gün başlığı */}
                <div className="bg-muted/30 flex items-center justify-between border-b px-5 py-3.5">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(day)}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {formatTime(first.session_started)} — {formatTime(first.session_ended)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workTime && (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        {workTime} mesai
                      </span>
                    )}
                    {breakLabel ? (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        <Coffee className="h-3 w-3" />
                        {breakLabel} mola
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs">Mola yok</span>
                    )}
                  </div>
                </div>

                {/* Olaylar */}
                <div className="divide-y">
                  {entries.map((entry) => {
                    const Icon = EVENT_ICON[entry.event_type];
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${EVENT_DOT[entry.event_type]}`}
                        />
                        <Icon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1 text-sm">{EVENT_LABELS[entry.event_type]}</span>
                        <span className="text-muted-foreground text-sm tabular-nums">
                          {formatTime(entry.occurred_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
