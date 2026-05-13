import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Clock, Coffee, Play, Square, CheckCircle2 } from "lucide-react";

type ShiftStatus = "mesaiye_baslamadi" | "mesaide" | "molada" | "mesai_bitti";
type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";

interface ShiftEvent {
  id: number;
  event_type: EventType;
  occurred_at: string;
}

interface User {
  full_name: string;
  email: string;
  role: "personel" | "yonetici";
}

function deriveStatus(events: ShiftEvent[]): ShiftStatus {
  if (events.length === 0) return "mesaiye_baslamadi";
  const last = events[events.length - 1].event_type;
  if (last === "mesai_baslat" || last === "mola_bitis") return "mesaide";
  if (last === "mola_baslat") return "molada";
  return "mesai_bitti";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_META: Record<ShiftStatus, { label: string; color: string; bg: string }> = {
  mesaiye_baslamadi: { label: "Henüz başlanmadı", color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-800" },
  mesaide:           { label: "Mesaidesizin",     color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/40" },
  molada:            { label: "Moladasınız",       color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  mesai_bitti:       { label: "Mesai tamamlandı", color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/40" },
};

const ACTIONS: Partial<Record<ShiftStatus, { endpoint: string; label: string; icon: typeof Play; style: string }[]>> = {
  mesaiye_baslamadi: [{ endpoint: "/shift/start",       label: "Mesai Başlat", icon: Play,   style: "bg-green-600 hover:bg-green-700 text-white" }],
  mesaide:           [{ endpoint: "/shift/break/start", label: "Molaya Çık",   icon: Coffee, style: "bg-amber-500 hover:bg-amber-600 text-white" },
                      { endpoint: "/shift/end",         label: "Mesai Bitir",  icon: Square, style: "bg-red-500 hover:bg-red-600 text-white" }],
  molada:            [{ endpoint: "/shift/break/end",   label: "Moladan Dön",  icon: Clock,  style: "bg-amber-500 hover:bg-amber-600 text-white" }],
};

const ACTION_SUCCESS: Record<string, string> = {
  "/shift/start":       "Mesai başlatıldı",
  "/shift/break/start": "Molaya çıkıldı",
  "/shift/break/end":   "Moladan dönüldü",
  "/shift/end":         "Mesai bitirildi",
};

export default function QrScanPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<ShiftEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) { navigate("/sign-in?next=/qr", { replace: true }); return; }
        const data: User = await res.json();
        if (data.role === "yonetici") { navigate("/admin", { replace: true }); return; }
        setUser(data);
        return fetch(`${API_URL}/shift/history`, { credentials: "include" }).then((r) => r.json());
      })
      .then((data) => data && setEvents(data.events ?? []))
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleAction(endpoint: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "İşlem başarısız");
      }
      const updated = await fetch(`${API_URL}/shift/history`, { credentials: "include" }).then((r) => r.json());
      setEvents(updated.events ?? []);
      toast.success(ACTION_SUCCESS[endpoint] ?? "İşlem başarılı");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  const status = deriveStatus(events);
  const meta = STATUS_META[status];
  const actions = ACTIONS[status] ?? [];
  const startEvent = events.find((e) => e.event_type === "mesai_baslat");

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <Clock className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">Mesai Takip</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        >
          Panele Git
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
        <div className="text-center">
          <div className="bg-muted text-muted-foreground mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold">{user.full_name}</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>

        <div className={`w-full rounded-2xl p-5 text-center ${meta.bg}`}>
          <p className={`text-lg font-semibold ${meta.color}`}>{meta.label}</p>
          {startEvent && (
            <p className="text-muted-foreground mt-1 text-sm">Giriş: {fmtTime(startEvent.occurred_at)}</p>
          )}
        </div>

        {status === "mesai_bitti" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-medium">Bugünkü mesainiz tamamlandı.</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.endpoint}
                  onClick={() => handleAction(action.endpoint)}
                  disabled={actionLoading}
                  className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-base font-semibold transition-colors disabled:opacity-50 ${action.style}`}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </main>

      <footer className="py-4 text-center">
        <p className="text-muted-foreground text-xs">YebSoft Mesai Takip</p>
      </footer>
    </div>
  );
}
