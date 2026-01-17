import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const adminToken = localStorage.getItem("admin_access");
  const userToken = localStorage.getItem("access");

  // ================= ADMIN ROUTE =================
  if (adminOnly) {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />;
    }
    return <>{children}</>;
  }

  // ================= USER ROUTE =================
  if (!userToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
