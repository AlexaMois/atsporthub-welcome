import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalProvider } from "@/lib/portal-context";
import { safeJsonParse } from "@/lib/api";
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
    <header className="h-14 bg-primary flex items-center justify-between px-3 sm:px-4 shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 bg-white/15 rounded-lg h-9 w-9 sm:w-auto sm:px-3 sm:gap-1.5 p-0 shrink-0"
          onClick={toggleSidebar}
          aria-label="Меню"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium hidden sm:inline">Меню</span>
        </Button>
        <img src={atsLogo} alt="АТС" className="h-7 w-7 sm:h-8 sm:w-8 rounded shrink-0" />
        <span className="text-white font-semibold text-sm truncate hidden min-[380px]:inline">АТС Портал</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {displayName && (
          <span className="text-white text-sm opacity-80 hidden md:inline truncate max-w-[200px]">{displayName}</span>
        )}
        {roleName && (
          <span className="text-white/60 text-xs hidden lg:inline truncate max-w-[200px]">{roleName}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 gap-1 h-9 px-2 sm:px-3"
          onClick={onLogout}
          aria-label="Выйти"
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

  // Всё через единую сессию user_token
  const userFio = localStorage.getItem("user_fio") ?? "";
  const userRoles: string[] = safeJsonParse<string[]>(localStorage.getItem("user_roles"), []);

  const roleName = userRoles.length === 1 ? userRoles[0] : undefined;
  const displayName = userFio || "";

  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem("welcome_shown") !== "true"
  );

  useEffect(() => {
    if (showWelcome) localStorage.setItem("welcome_shown", "true");
  }, [showWelcome]);

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_fio");
    localStorage.removeItem("user_roles");
    localStorage.removeItem("welcome_shown");
    navigate("/login");
  };

  return (
    <PortalProvider roleName={roleName} userRoles={userRoles.length > 0 ? userRoles : undefined}>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <PortalSidebar roleName={roleName} />
          <SidebarInset>
            <PortalHeader onLogout={handleLogout} displayName={displayName} roleName={userRoles.length > 0 ? userRoles.join(", ") : undefined} />
            {showWelcome && (
              <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 mb-2 p-3 sm:p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm sm:text-base truncate">
                    {displayName ? `Добрый день, ${(() => {
                      const parts = displayName.trim().split(/\s+/);
                      if (parts.length >= 3) return `${parts[1]} ${parts[2]}`;
                      if (parts.length === 2) return parts[1];
                      return parts[0];
                    })()}!` : "Добрый день!"}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
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
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  aria-label="Закрыть"
                >
                  ✕
                </button>
              </div>
            )}
            <PortalBreadcrumb />
            <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col min-h-0">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PortalProvider>
  );
}
