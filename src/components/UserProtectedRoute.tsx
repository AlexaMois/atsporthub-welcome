import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { apiCall } from "@/lib/api";

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    apiCall("verify-token", { token }).then((result) => {
      if (result.ok && result.data?.valid) {
        setStatus("valid");
      } else {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_fio");
        localStorage.removeItem("user_roles");
        setStatus("invalid");
      }
    });
  }, []);

  if (status === "loading") return null;
  if (status === "invalid") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default UserProtectedRoute;
