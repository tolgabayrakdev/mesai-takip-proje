import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", { credentials: "include" })
      .then((res) => setIsAuthenticated(res.ok))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Yükleniyor...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/sign-in" replace />;

  return <>{children}</>;
}
