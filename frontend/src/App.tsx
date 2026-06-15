import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import ProtectedRoute from "./auth/ProtectedRoute";
import RegisterKeyPage from "./auth/RegisterKeyPage";
import Layout from "./components/Layout";
import CalendarPage from "./pages/Calendar";
import Console from "./pages/Console";
import Dashboard from "./pages/Dashboard";
import Finance from "./pages/Finance";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/console" element={<Console />} />
            <Route path="/security" element={<RegisterKeyPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
