import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="card">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  return <>{children}</>;
}

export function RoleRoute({
  allow,
  children,
}: {
  allow: Array<"guest" | "user" | "provider" | "admin">;
  children: ReactNode;
}) {
  const { user, role, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="card">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!allow.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
