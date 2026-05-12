import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { AppSidebar, type SidebarUser } from "@/components/app-sidebar";
import { API_URL } from "@/lib/config";
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

export default function LayoutContent() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SidebarUser | null>(null);
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
    <div className="flex min-h-screen bg-background">
      <AppSidebar user={user} onLogout={() => setLogoutOpen(true)} />

      <main className="flex-1 md:ml-64">
        <div className="p-4 pt-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet context={user} />
          </div>
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış yapmak istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>
              Oturumunuz sonlandırılacaktır.
            </AlertDialogDescription>
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
