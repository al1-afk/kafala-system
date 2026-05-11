import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useDataStore } from "./stores/dataStore";
import { Layout } from "./components/Layout";
import { Toaster } from "./components/ui/Toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Families from "./pages/Families";
import FamilyForm from "./pages/FamilyForm";
import FamilyDetail from "./pages/FamilyDetail";
import Parents from "./pages/Parents";
import Orphans from "./pages/Orphans";
import Schooling from "./pages/Schooling";
import IndicatorsSettings from "./pages/IndicatorsSettings";
import IndicatorsView from "./pages/IndicatorsView";
import Classification from "./pages/Classification";
import Workshops from "./pages/Workshops";
import Housing from "./pages/Housing";
import Savings from "./pages/Savings";
import Equipment from "./pages/Equipment";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuthStore();
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

export default function App() {
  const { theme } = useSettingsStore();
  const { families, loadSeed } = useDataStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (families.length === 0) {
      loadSeed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="/families" element={<Families />} />
          <Route path="/families/new" element={<FamilyForm />} />
          <Route path="/families/:id" element={<FamilyDetail />} />
          <Route path="/families/:id/edit" element={<FamilyForm />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/orphans" element={<Orphans />} />
          <Route path="/schooling" element={<Schooling />} />
          <Route path="/workshops" element={<Workshops />} />
          <Route path="/classification" element={<Classification />} />
          <Route path="/indicators" element={<IndicatorsView />} />
          <Route path="/settings/indicators" element={<IndicatorsSettings />} />
          <Route path="/housing" element={<Housing />} />
          <Route path="/savings" element={<Savings />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
