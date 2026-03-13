import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  redirectTo = "/login/director",
}: ProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");

  useEffect(() => {
    const token = sessionStorage.getItem("director_token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`${FUNC_URL}?action=verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setStatus("valid");
        } else {
          sessionStorage.removeItem("director_token");
          setStatus("invalid");
        }
      })
      .catch(() => {
        // Network error — allow access if token exists (graceful degradation)
        setStatus("valid");
      });
  }, []);

  if (status === "loading") return null;
  if (status === "invalid") return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
