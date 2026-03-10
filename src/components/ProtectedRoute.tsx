import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — закрывает маршрут для неавторизованных пользователей.
 * Проверяет наличие флага в sessionStorage, установленного после ввода пароля.
 *
 * NOTE: Это клиентская защита от случайного перехода.
 * Для production рекомендуется перенести аутентификацию на Supabase Auth.
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  storageKey?: string;
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  storageKey = "director_auth",
  redirectTo = "/login/director",
}: ProtectedRouteProps) => {
  const isAuthenticated = sessionStorage.getItem(storageKey) === "true";

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
