import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "@/lib/config";
import { Clock, Coffee, Play, Square, User, ChevronRight, QrCode } from "lucide-react";

type ShiftStatus =
  | "mesaiye_baslamadi"
  | "mesaide"
  | "molada"
  | "mesai_bitti";

interface Employee {
  id: number;
  full_name: string;
  email: string;
  todayStatus: ShiftStatus;
  startedAt: string | null;
  totalBreakMinutes: number;
}

const STATUS_CONFIG: Record<ShiftStatus, {
  label: string;
  badge: string;
  dot: string;
  icon: typeof Clock;
}> = {
  mesaiye_baslamadi: {
    label: "Başlamadı",
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dot: "bg-gray-400",
    icon: User,
  },
  mesaide: {
    label: "Mesaide",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
    dot: "bg-green-500",
    icon: Play,
  },
  molada: {
    label: "Molada",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: Coffee,
  },
  mesai_bitti: {
    label: "Bitti",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
    dot: "bg-blue-500",
    icon: Square,
  },
};

const STAT_ORDER: ShiftStatus[] = ["mesaide", "molada", "mesai_bitti", "mesaiye_baslamadi"];
const STAT_LABELS: Record<ShiftStatus, string> = {
  mesaide: "Mesaide",
  molada: "Molada",
  mesai_bitti: "Tamamlandı",
  mesaiye_baslamadi: "Başlamadı",
};

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminIndex() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchEmployees() {
    const res = await fetch(`${API_URL}/admin/employees`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setEmployees(data.filter((e: Employee & { role?: string }) => e.role !== "yonetici"));
  }

  useEffect(() => {
    fetchEmployees().finally(() => setLoading(false));

    const id = setInterval(fetchEmployees, 10_000);
    return () => clearInterval(id);
  }, []);

  const counts = employees.reduce<Record<ShiftStatus, number>>(
    (acc, e) => { acc[e.todayStatus]++; return acc; },
    { mesaiye_baslamadi: 0, mesaide: 0, molada: 0, mesai_bitti: 0 }
  );

  const activeEmployees = employees.filter(
    (e) => e.todayStatus === "mesaide" || e.todayStatus === "molada"
  );
  const doneEmployees = employees.filter((e) => e.todayStatus === "mesai_bitti");
  const pendingEmployees = employees.filter((e) => e.todayStatus === "mesaiye_baslamadi");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Yönetici Paneli</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/qr")}
          className="flex items-center gap-2 rounded-xl border bg-card hover:bg-muted px-3.5 py-2 text-sm font-medium transition-colors shrink-0"
        >
          <QrCode className="h-4 w-4" />
          QR Kod
        </button>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STAT_ORDER.map((key) => {
          const cfg = STATUS_CONFIG[key];
          const Icon = cfg.icon;
          return (
            <div key={key} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{STAT_LABELS[key]}</span>
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold tabular-nums">{counts[key]}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 ${cfg.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aktif personel */}
      {activeEmployees.length > 0 && (
        <EmployeeSection
          title="Aktif Personel"
          employees={activeEmployees}
          navigate={navigate}
          showBreak
          showStart
        />
      )}

      {/* Mesai bitmiş */}
      {doneEmployees.length > 0 && (
        <EmployeeSection
          title="Mesai Tamamlandı"
          employees={doneEmployees}
          navigate={navigate}
          showBreak
          muted
        />
      )}

      {/* Başlamamış */}
      {pendingEmployees.length > 0 && (
        <EmployeeSection
          title="Henüz Başlamadı"
          employees={pendingEmployees}
          navigate={navigate}
          muted
        />
      )}
    </div>
  );
}

function EmployeeSection({
  title,
  employees,
  navigate,
  showBreak,
  showStart,
  muted,
}: {
  title: string;
  employees: Employee[];
  navigate: (to: string) => void;
  showBreak?: boolean;
  showStart?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className={`px-5 py-3 border-b ${muted ? "bg-muted/30" : "bg-muted/50"}`}>
        <p className={`text-sm font-semibold ${muted ? "text-muted-foreground" : ""}`}>
          {title}
          <span className="font-normal text-muted-foreground ml-1.5">({employees.length})</span>
        </p>
      </div>
      <div className="divide-y">
        {employees.map((emp) => {
          const cfg = STATUS_CONFIG[emp.todayStatus];
          return (
            <div
              key={emp.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot} ${
                emp.todayStatus === "mesaide" || emp.todayStatus === "molada" ? "animate-pulse" : ""
              }`} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{emp.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {showStart && emp.startedAt && (
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-muted-foreground">Başlangıç</p>
                    <p className="text-sm tabular-nums font-medium">{formatTime(emp.startedAt)}</p>
                  </div>
                )}
                {showBreak && (
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-muted-foreground">Mola</p>
                    <p className="text-sm tabular-nums font-medium">
                      {emp.totalBreakMinutes > 0 ? `${emp.totalBreakMinutes} dk` : "—"}
                    </p>
                  </div>
                )}
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <button
                  onClick={() => navigate(`/admin/employees/${emp.id}/history`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Geçmişi Gör"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
