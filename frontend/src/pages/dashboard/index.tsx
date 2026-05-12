import { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Play, Square, Timer, Clock } from "lucide-react";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import type { SidebarUser } from "@/components/app-sidebar";

type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";
type ShiftStatus = "mesaiye_baslamadi" | "mesaide" | "molada" | "mesai_bitti";

interface ShiftEvent {
  id: number;
  event_type: EventType;
  occurred_at: string;
}

const EVENT_LABELS: Record<EventType, string> = {
  mesai_baslat: "Mesai Başlatıldı",
  mola_baslat: "Molaya Çıkıldı",
  mola_bitis: "Moladan Dönüldü",
  mesai_bitir: "Mesai Bitirildi",
};

const EVENT_DOT: Record<EventType, string> = {
  mesai_baslat: "bg-green-500",
  mola_baslat: "bg-amber-500",
  mola_bitis: "bg-amber-500",
  mesai_bitir: "bg-blue-500",
};

const STATUS_CONFIG: Record<ShiftStatus, {
  label: string;
  bg: string;
  text: string;
  dot: string;
  pulse: boolean;
}> = {
  mesaiye_baslamadi: {
    label: "Henüz Başlanmadı",
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    dot: "bg-gray-400",
    pulse: false,
  },
  mesaide: {
    label: "Mesaidesizin",
    bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
    pulse: true,
  },
  molada: {
    label: "Moladasınız",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    pulse: true,
  },
  mesai_bitti: {
    label: "Mesai Tamamlandı",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
    pulse: false,
  },
};

function deriveStatus(events: ShiftEvent[]): ShiftStatus {
  if (events.length === 0) return "mesaiye_baslamadi";
  const last = events[events.length - 1].event_type;
  if (last === "mesai_baslat" || last === "mola_bitis") return "mesaide";
  if (last === "mola_baslat") return "molada";
  if (last === "mesai_bitir") return "mesai_bitti";
  return "mesaiye_baslamadi";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatElapsed(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}s ${String(m).padStart(2, "0")}dk`;
  return `${m}dk ${String(s).padStart(2, "0")}sn`;
}

async function fetchHistory(): Promise<{ events: ShiftEvent[]; totalBreakMinutes: number } | null> {
  const res = await fetch(`${API_URL}/shift/history`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

export default function DashboardIndex() {
  const user = useOutletContext<SidebarUser>();
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  const status = deriveStatus(events);
  const cfg = STATUS_CONFIG[status];

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchHistory().then((data) => {
      if (data) {
        setEvents(data.events);
        setTotalBreakMinutes(data.totalBreakMinutes ?? 0);
      }
      setLoading(false);
    });
  }, []);

  async function callShiftAction(endpoint: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "İşlem başarısız");
      }
      const data = await fetchHistory();
      if (data) {
        setEvents(data.events);
        setTotalBreakMinutes(data.totalBreakMinutes ?? 0);
      }
      const labels: Record<string, string> = {
        "/shift/start": "Mesai başlatıldı",
        "/shift/break/start": "Molaya çıkıldı",
        "/shift/break/end": "Moladan dönüldü",
        "/shift/end": "Mesai bitirildi",
      };
      toast.success(labels[endpoint] ?? "İşlem başarılı");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  }

  const shiftStartEvent = events.find((e) => e.event_type === "mesai_baslat");
  const shiftEndEvent = events.find((e) => e.event_type === "mesai_bitir");
  const elapsedMs =
    shiftStartEvent && (status === "mesaide" || status === "molada")
      ? now.getTime() - new Date(shiftStartEvent.occurred_at).getTime()
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Başlık + saat */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hoş geldiniz</p>
          <h1 className="text-2xl font-bold tracking-tight">{user.full_name}</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-semibold tabular-nums">
            {now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {/* Durum kartı */}
      <div className={`rounded-xl border p-5 ${cfg.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`}
            />
            <span className={`font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
          {elapsedMs !== null && (
            <span className={`text-sm font-mono font-medium tabular-nums flex items-center gap-1 ${cfg.text}`}>
              <Timer className="h-3.5 w-3.5" />
              {formatElapsed(elapsedMs)}
            </span>
          )}
        </div>

        {shiftStartEvent && (
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <p className={`text-xs mb-0.5 opacity-60 ${cfg.text}`}>Başlangıç</p>
              <p className={`font-semibold ${cfg.text}`}>{formatTime(shiftStartEvent.occurred_at)}</p>
            </div>
            {shiftEndEvent && (
              <div>
                <p className={`text-xs mb-0.5 opacity-60 ${cfg.text}`}>Bitiş</p>
                <p className={`font-semibold ${cfg.text}`}>{formatTime(shiftEndEvent.occurred_at)}</p>
              </div>
            )}
            {totalBreakMinutes > 0 && (
              <div>
                <p className={`text-xs mb-0.5 opacity-60 ${cfg.text}`}>Toplam Mola</p>
                <p className={`font-semibold ${cfg.text}`}>{totalBreakMinutes} dk</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aksiyon butonları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          onClick={() => callShiftAction("/shift/start")}
          disabled={status !== "mesaiye_baslamadi" || actionLoading}
          className="h-14 flex-col gap-1.5 bg-green-600 hover:bg-green-700 text-white disabled:opacity-30"
        >
          <Play className="h-4 w-4" />
          <span className="text-xs font-medium">Mesai Başlat</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => callShiftAction("/shift/break/start")}
          disabled={status !== "mesaide" || actionLoading}
          className="h-14 flex-col gap-1.5 disabled:opacity-30"
        >
          <Coffee className="h-4 w-4" />
          <span className="text-xs font-medium">Molaya Çık</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => callShiftAction("/shift/break/end")}
          disabled={status !== "molada" || actionLoading}
          className="h-14 flex-col gap-1.5 disabled:opacity-30"
        >
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Moladan Dön</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => callShiftAction("/shift/end")}
          disabled={status !== "mesaide" || actionLoading}
          className="h-14 flex-col gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-30"
        >
          <Square className="h-4 w-4" />
          <span className="text-xs font-medium">Mesai Bitir</span>
        </Button>
      </div>

      {/* Günlük geçmiş */}
      {events.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bugünkü Hareketler
              </p>
            </div>
            <div className="divide-y">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${EVENT_DOT[event.event_type]}`} />
                  <span className="text-sm flex-1">{EVENT_LABELS[event.event_type]}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {formatTime(event.occurred_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
