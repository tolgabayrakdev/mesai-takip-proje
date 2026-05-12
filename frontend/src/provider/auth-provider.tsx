import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import { API_URL } from "@/lib/config";

interface AuthProviderProps {
  children: ReactNode;
  role?: "personel" | "yonetici";
}

export default function AuthProvider({ children, role }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async (res) => {
        if (res.ok) setUser(await res.json());
        else setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/sign-in" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === "yonetici" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
