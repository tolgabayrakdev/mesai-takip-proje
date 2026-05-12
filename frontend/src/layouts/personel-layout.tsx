import AuthProvider from "@/provider/auth-provider";
import LayoutContent from "./layout-content";

export default function PersonelLayout() {
  return (
    <AuthProvider role="personel">
      <LayoutContent />
    </AuthProvider>
  );
}
