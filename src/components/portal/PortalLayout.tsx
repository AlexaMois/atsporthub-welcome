import { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalProvider } from "@/lib/portal-context";
import { PortalSidebar } from "./PortalSidebar";
import { PortalBreadcrumb } from "./PortalBreadcrumb";
import atsLogo from "@/assets/ats-logo.jpg";
import {
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

function PortalHeader({ onLogout, displayName, roleName }: { onLogout: () => void; displayName?: string; roleName?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="h-14 bg-primary flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 bg-white/15 rounded-lg gap-1.5 h-9 px-3"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium md:hidden">Меню</span>
        </Button>
        <img src={atsLogo} alt="АТС" className="h-8 w-8 rounded" />
        <span className="text-white font-semibold text-sm">АТС Портал</span>
      </div>
      <div className="flex items-center gap-3">
        {displayName && (
          <span className="text-white text-sm opacity-80 hidden md:inline">{displayName}</span>
        )}
        {roleName && (
          <span className="text-white/60 text-xs hidden lg:inline">{roleName}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 gap-1"
          onClick={onLogout}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </header>
  );
}

export default function PortalLayout() {
  const navigate = useNavigate();
  const { roleName: roleNameParam } = useParams<{ roleName?: string }>();

  // Определяем режим: директор, обычный сотрудник или старый role-маршрут
  const isDirector = Boolean(sessionStorage.getItem("director_token"));
  const userToken = sessionStorage.getItem("user_token");
  const userFio = sessionStorage.getItem("user_fio") ?? "";
  const userRoles: string[] = JSON.parse(sessionStorage.getItem("user_roles") ?? "[]");

  // roleName: из URL (старый маршрут) или первая роль сотрудника
  const roleName = roleNameParam ?? (userRoles.length === 1 ? userRoles[0] : undefined);

  const isUserSession = Boolean(userToken);
  const displayName = userFio || (isDirector ? "Директор" : "");

  const [showWelcome, setShowWelcome] = useState(
    () => sessionStorage.getItem("welcome_shown") !== "true"
  );

  useEffect(() => {
    if (showWelcome) sessionStorage.setItem("welcome_shown", "true");
  }, [showWelcome]);

  const handleLogout = () => {
    sessionStorage.removeItem("director_token");
    sessionStorage.removeItem("user_token");
    sessionStorage.removeItem("user_fio");
    sessionStorage.removeItem("user_roles");
    sessionStorage.removeItem("welcome_shown");
    navigate("/login");
  };

  return (
    <PortalProvider roleName={roleName} userRoles={isUserSession ? userRoles : undefined}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <PortalSidebar roleName={roleName} />
          <SidebarInset>
            <PortalHeader onLogout={handleLogout} displayName={displayName} roleName={isUserSession && userRoles.length > 0 ? userRoles.join(", ") : undefined} />
            {showWelcome && (
              <div className="mx-6 mt-4 mb-2 p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {displayName ? `Добрый день, ${(() => {
                      const parts = displayName.trim().split(/\s+/);
                      if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
                      if (parts.length === 2) return parts[1];
                      return parts[0];
                    })()}!` : "Добрый день!"}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString("ru-RU", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            )}
            <PortalBreadcrumb />
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PortalProvider>
  );
}
