import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Clock, Coffee, Play, Square, CheckCircle2, LogIn } from "lucide-react";

type ShiftStatus = "mesaiye_baslamadi" | "mesaide" | "molada" | "mesai_bitti";
type EventType = "mesai_baslat" | "mola_baslat" | "mola_bitis" | "mesai_bitir";

interface ShiftEvent {
  id: number;
  event_type: EventType;
  occurred_at: string;
}

interface User {
  id: number;
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
  mesai_bitti:       { label: "Mesai tamamlandı", color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-950/40" },
};

const ACTIONS: Partial<Record<ShiftStatus, { endpoint: string; label: string; icon: typeof Play; style: string }[]>> = {
  mesaiye_baslamadi: [
    { endpoint: "/shift/start", label: "Mesai Başlat", icon: Play, style: "bg-green-600 hover:bg-green-700 text-white" },
  ],
  mesaide: [
    { endpoint: "/shift/break/start", label: "Molaya Çık",  icon: Coffee, style: "bg-amber-500 hover:bg-amber-600 text-white" },
    { endpoint: "/shift/end",         label: "Mesai Bitir", icon: Square, style: "bg-red-500 hover:bg-red-600 text-white" },
  ],
  molada: [
    { endpoint: "/shift/break/end", label: "Moladan Dön", icon: Clock, style: "bg-amber-500 hover:bg-amber-600 text-white" },
  ],
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
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          navigate("/sign-in?next=/qr", { replace: true });
          return;
        }
        const data: User = await res.json();
        if (data.role === "yonetici") {
          navigate("/admin", { replace: true });
          return;
        }
        setUser(data);
        setAuthChecked(true);
      });
  }, [navigate]);

  useEffect(() => {
    if (!authChecked) return;
    fetch(`${API_URL}/shift/history`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .finally(() => setLoading(false));
  }, [authChecked]);

  async function handleAction(endpoint: string) {
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
      const updated = await fetch(`${API_URL}/shift/history`, { credentials: "include" });
      const data = await updated.json();
      setEvents(data.events ?? []);
      toast.success(ACTION_SUCCESS[endpoint] ?? "İşlem başarılı");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız");
    } finally {
      setActionLoading(false);
    }
  }

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  const status = deriveStatus(events);
  const meta = STATUS_META[status];
  const actions = ACTIONS[status] ?? [];
  const startEvent = events.find((e) => e.event_type === "mesai_baslat");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground">
            <Clock className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm">Mesai Takip</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Panele Git
        </button>
      </header>

      {/* İçerik */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-8 max-w-sm mx-auto w-full">
        {/* Kullanıcı */}
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-muted-foreground">
            {user.full_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-xl font-bold">{user.full_name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {/* Durum */}
        <div className={`w-full rounded-2xl p-5 text-center ${meta.bg}`}>
          <p className={`text-lg font-semibold ${meta.color}`}>{meta.label}</p>
          {startEvent && (
            <p className="text-sm text-muted-foreground mt-1">
              Giriş: {fmtTime(startEvent.occurred_at)}
            </p>
          )}
        </div>

        {/* Aksiyonlar */}
        {status === "mesai_bitti" ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <CheckCircle2 className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-medium">Bugünkü mesainiz tamamlandı.</p>
            <p className="text-xs text-muted-foreground">Yarın görüşmek üzere!</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.endpoint}
                  onClick={() => handleAction(action.endpoint)}
                  disabled={actionLoading}
                  className={`w-full flex items-center justify-center gap-3 rounded-xl py-4 text-base font-semibold transition-colors disabled:opacity-50 ${action.style}`}
                >
                  <Icon className="h-5 w-5" />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Giriş yapılmamışsa gösterilecek uyarı (logout sonrası) */}
        {status === "mesaiye_baslamadi" && (
          <p className="text-xs text-muted-foreground text-center">
            Mesai işlemi yapmak için butona basın.
          </p>
        )}
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground">YebSoft Mesai Takip</p>
      </footer>
    </div>
  );
}

export function QrLoginPrompt() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground">
        <Clock className="h-7 w-7" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold">Giriş Yapmanız Gerekiyor</h1>
        <p className="text-sm text-muted-foreground mt-1">QR işlem sayfasına erişmek için lütfen giriş yapın.</p>
      </div>
      <button
        onClick={() => navigate("/sign-in?next=/qr")}
        className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold"
      >
        <LogIn className="h-4 w-4" />
        Giriş Yap
      </button>
    </div>
  );
}
