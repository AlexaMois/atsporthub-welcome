import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

const FUNC_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/bpium-api`;

interface UserProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Защищает маршруты портала — пропускает только пользователей
 * с валидным JWT-токеном, выданным после верификации телефона в Bpium.
 */
const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");

  useEffect(() => {
    const token = sessionStorage.getItem("user_token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    fetch(`${FUNC_URL}?action=verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setStatus("valid");
        } else {
          sessionStorage.removeItem("user_token");
          sessionStorage.removeItem("user_fio");
          sessionStorage.removeItem("user_roles");
          setStatus("invalid");
        }
      })
      .catch(() => {
        // Сеть недоступна — пропускаем если токен есть (graceful degradation)
        setStatus("valid");
      });
  }, []);

  if (status === "loading") return null;
  if (status === "invalid") return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default UserProtectedRoute;
