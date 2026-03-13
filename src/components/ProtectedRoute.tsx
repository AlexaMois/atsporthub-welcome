import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

import { FUNC_URL, SUPABASE_ANON_KEY as ANON_KEY } from "@/lib/config";

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
