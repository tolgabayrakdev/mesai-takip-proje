import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Coffee, CalendarDays, Clock, Play, Square } from "lucide-react";
import { API_URL } from "@/lib/config";

type Period = "daily" | "weekly" | "monthly";
type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";

interface HistoryEntry {
  id: number;
  event_type: EventType;
  occurred_at: string;
  date: string;
  session_started: string;
  session_ended: string | null;
  total_break_minutes: number;
}

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
  { key: "daily",   label: "Bugün",    desc: "Bugünkü kayıtlar" },
  { key: "weekly",  label: "Haftalık", desc: "Son 7 gün" },
  { key: "monthly", label: "Aylık",    desc: "Son 30 gün" },
];

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

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

function calcWorkMinutes(session_started: string, session_ended: string | null, total_break_minutes: number) {
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

  useEffect(() => {
    fetch(`${API_URL}/admin/employees/${id}`, { credentials: "include" })
      .then((res) => { if (!res.ok) navigate("/admin"); return res.json(); })
      .then((data) => setEmployeeName(data.full_name ?? "Personel"))
      .catch(() => navigate("/admin"));
  }, [id, navigate]);

  useEffect(() => {
    fetch(`${API_URL}/admin/employees/${id}/history?period=${period}`, { credentials: "include" })
      .then((res) => res.json())
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [id, period]);

  const grouped = history.reduce<Record<string, HistoryEntry[]>>((acc, e) => {
    const day = e.date.slice(0, 10);
    (acc[day] ??= []).push(e);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const activePeriod = PERIODS.find((p) => p.key === period)!;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Başlık */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/admin")}
          className="flex items-center justify-center h-8 w-8 rounded-lg border bg-card hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{employeeName || "—"}</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            Hareket Geçmişi
          </p>
        </div>
      </div>

      {/* Periyot seçici */}
      <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-muted">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`relative rounded-lg py-2.5 text-sm font-medium transition-all ${
              period === p.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="block">{p.label}</span>
            <span className={`block text-xs font-normal mt-0.5 ${period === p.key ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
              {p.desc}
            </span>
          </button>
        ))}
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground text-sm">Yükleniyor...</p>
        </div>
      ) : days.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Kayıt bulunamadı</p>
          <p className="text-xs text-muted-foreground/60">{activePeriod.desc} için herhangi bir işlem yapılmamış</p>
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
                : hadBreak ? "< 1 dk" : null;
            const workTime = calcWorkMinutes(first.session_started, first.session_ended, first.total_break_minutes);

            return (
              <div key={day} className="rounded-xl border bg-card overflow-hidden">
                {/* Gün başlığı */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">{formatDate(day)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {formatTime(first.session_started)} — {formatTime(first.session_ended)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {workTime && (
                      <span className="text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full px-2.5 py-1">
                        {workTime} mesai
                      </span>
                    )}
                    {breakLabel ? (
                      <span className="flex items-center gap-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full px-2.5 py-1">
                        <Coffee className="h-3 w-3" />
                        {breakLabel} mola
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">Mola yok</span>
                    )}
                  </div>
                </div>

                {/* Olaylar */}
                <div className="divide-y">
                  {entries.map((entry) => {
                    const Icon = EVENT_ICON[entry.event_type];
                    return (
                      <div key={entry.id} className="flex items-center gap-3 px-5 py-2.5">
                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${EVENT_DOT[entry.event_type]}`} />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{EVENT_LABELS[entry.event_type]}</span>
                        <span className="text-sm tabular-nums text-muted-foreground">
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
