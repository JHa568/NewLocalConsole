import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import BackgroundBlobs from "./components/BackgroundBlobs";
import Layout from "./components/Layout";
import CalendarPage from "./pages/Calendar";
import Console from "./pages/Console";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import { ThemeProvider } from "./theme/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BackgroundBlobs />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/console" element={<Console />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
