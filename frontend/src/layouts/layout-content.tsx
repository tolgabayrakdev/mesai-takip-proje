import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { API_URL } from "@/lib/config";
import { Clock, LogOut } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface User {
  full_name: string;
  email: string;
  role: "personel" | "yonetici";
}

export default function LayoutContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then(setUser);
  }, []);

  async function handleLogout() {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    navigate("/sign-in");
  }

  if (!user) return null;

  return (
    <div className="bg-background min-h-screen">
      <nav className="bg-card sticky top-0 z-10 flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg">
            <Clock className="h-4 w-4" />
          </div>
          <span className="font-semibold">Mesai Takip</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.full_name}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
            <p className="text-muted-foreground text-xs">
              {user.role === "yonetici" ? "Yönetici" : "Personel"}
            </p>
          </div>
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLogoutOpen(true)}
            title="Çıkış Yap"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Outlet context={user} />
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış yapmak istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>Oturumunuz sonlandırılacaktır.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Çıkış Yap</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
