import AuthProvider from "@/provider/auth-provider";
import LayoutContent from "./layout-content";

export default function AdminLayout() {
  return (
    <AuthProvider role="yonetici">
      <LayoutContent />
    </AuthProvider>
  );
}
