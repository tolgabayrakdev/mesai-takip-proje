import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import DashboardLayout from "./layouts/dashboard-layout";
import SignIn from "./pages/auth/sign-in";
import DashboardIndex from "./pages/dashboard/index";
import AdminIndex from "./pages/admin/index";
import AdminHistory from "./pages/admin/history";
import { Toaster } from "@/components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/",
    element: <Navigate to="/sign-in" replace />,
  },
  {
    path: "/dashboard",
    element: <DashboardLayout role="personel" />,
    children: [{ index: true, element: <DashboardIndex /> }],
  },
  {
    path: "/admin",
    element: <DashboardLayout role="yonetici" />,
    children: [
      { index: true, element: <AdminIndex /> },
      { path: "employees/:id/history", element: <AdminHistory /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  </StrictMode>
);
