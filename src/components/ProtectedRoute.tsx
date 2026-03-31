import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { apiCall } from "@/lib/api";

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

    apiCall("verify-token", { token }).then((result) => {
      if (result.ok && result.data?.valid) {
        setStatus("valid");
      } else {
        sessionStorage.removeItem("director_token");
        setStatus("invalid");
      }
    });
  }, []);

  if (status === "loading") return null;
  if (status === "invalid") return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
