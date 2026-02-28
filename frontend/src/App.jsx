import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import PatientDashboard from "./pages/PatientDashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #f0f4f8 100%)",
        }}
      >
        <div className="text-gray-900 text-xl animate-pulse">
          💊 Loading PulseGuard…
        </div>
      </div>
    );
  if (!user) return <Navigate to="/" />;
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate to={user.role === "caregiver" ? "/caregiver" : "/dashboard"} />
    );
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={user.role === "caregiver" ? "/caregiver" : "/dashboard"}
            />
          ) : (
            <LandingPage />
          )
        }
      />
      <Route
        path="/auth"
        element={
          user ? (
            <Navigate
              to={user.role === "caregiver" ? "/caregiver" : "/dashboard"}
            />
          ) : (
            <AuthPage />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/caregiver"
        element={
          <ProtectedRoute requiredRole="caregiver">
            <CaregiverDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate
            to={
              user
                ? user.role === "caregiver"
                  ? "/caregiver"
                  : "/dashboard"
                : "/"
            }
          />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
