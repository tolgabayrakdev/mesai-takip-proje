import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { API_URL } from "@/lib/config";
import { toast } from "sonner";
import { Clock } from "lucide-react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) return toast.error("E-posta adresi boş olamaz");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return toast.error("Geçerli bir e-posta adresi giriniz");
    if (!password) return toast.error("Şifre boş olamaz");
    if (password.length < 6) return toast.error("Şifre en az 6 karakter olmalıdır");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "E-posta veya şifre hatalı");
      }
      const data = await res.json();
      toast.success("Giriş başarılı");
      if (nextPath && data.user.role === "personel") {
        navigate(nextPath);
      } else {
        navigate(data.user.role === "yonetici" ? "/admin" : "/dashboard");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <div className="bg-primary text-primary-foreground mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mesai Takip</h1>
            <p className="text-muted-foreground mt-1 text-sm">Hesabınıza giriş yapın</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-posta</label>
            <Input
              type="email"
              placeholder="personel@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Şifre</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>
      </div>
    </div>
  );
}
