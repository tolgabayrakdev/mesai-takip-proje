import { Link, useLocation } from "react-router";
import { Clock, LayoutDashboard, LogOut, Users } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export interface SidebarUser {
  full_name: string;
  email: string;
  role: "personel" | "yonetici";
}

interface AppSidebarProps {
  user: SidebarUser;
  onLogout: () => void;
}

export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  const location = useLocation();

  const navItems =
    user.role === "yonetici"
      ? [{ to: "/admin", label: "Genel Bakış", icon: LayoutDashboard }]
      : [{ to: "/dashboard", label: "Mesaim", icon: Users }];

  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + "/");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 flex flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Clock className="h-4 w-4" />
        </div>
        <span className="font-semibold">Mesai Takip</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(to)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Alt bölüm */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between">
          <ModeToggle />
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground">
            {user.role === "yonetici" ? "Yönetici" : "Personel"}
          </p>
        </div>
      </div>
    </aside>
  );
}
