import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PrivateRoute, PublicRoute } from "./components/RouteGuard";
import DailyPopup from "./components/DailyPopup";
import { useDailyPopup } from "./hooks/useDailyPopup";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import DatasetsPage from "./pages/DatasetsPage";
import DatasetDetailPage from "./pages/DatasetDetailPage";
import SearchPage from "./pages/SearchPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AuditPage from "./pages/AuditPage";

const ADMIN_ROLES = ["super_admin", "org_admin"];

function AppContent() {
  const { user } = useAuth();
  const { isVisible, dismiss, neverShow } = useDailyPopup();

  return (
    <>
      {/* Show the daily insight popup only for authenticated users */}
      {user && (
        <DailyPopup isVisible={isVisible} dismiss={dismiss} neverShow={neverShow} />
      )}
      <Routes>
          {/* Public auth routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected app routes */}
          <Route path="/dashboard" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
          <Route path="/datasets" element={<PrivateRoute><Layout><DatasetsPage /></Layout></PrivateRoute>} />
          <Route path="/datasets/:id" element={<PrivateRoute><Layout><DatasetDetailPage /></Layout></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Layout><SearchPage /></Layout></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Layout><NotificationsPage /></Layout></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/organizations" element={
            <PrivateRoute roles={ADMIN_ROLES}><Layout><OrganizationsPage /></Layout></PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute roles={ADMIN_ROLES}><Layout><UsersPage /></Layout></PrivateRoute>
          } />
          <Route path="/categories" element={
            <PrivateRoute roles={ADMIN_ROLES}><Layout><CategoriesPage /></Layout></PrivateRoute>
          } />
          <Route path="/audit" element={
            <PrivateRoute roles={ADMIN_ROLES}><Layout><AuditPage /></Layout></PrivateRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<PrivateRoute><Layout><div style={{ padding: 48, textAlign: "center" }}>
            <h2 style={{ fontFamily: "Sora", marginBottom: 8 }}>404 — Page not found</h2>
            <a href="/dashboard" style={{ color: "var(--green)" }}>Go to Dashboard</a>
          </div></Layout></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
