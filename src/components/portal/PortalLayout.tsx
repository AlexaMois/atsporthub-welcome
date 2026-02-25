import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortalProvider } from "@/lib/portal-context";
import { PortalSidebar } from "./PortalSidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function PortalLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("director_auth") !== "true") {
      navigate("/login/director", { replace: true });
    }
  }, [navigate]);

  if (sessionStorage.getItem("director_auth") !== "true") {
    return null;
  }

  const handleLogout = () => {
    sessionStorage.removeItem("director_auth");
    navigate("/");
  };

  return (
    <PortalProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-[#f5f7fa]">
          <PortalSidebar />
          <SidebarInset>
            <header className="h-14 bg-[#0099ff] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-white hover:bg-white/20" />
                <span className="text-white font-semibold text-sm">АТС Портал</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm opacity-80 hidden md:inline">Генеральный директор</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 gap-1"
                  onClick={handleLogout}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </Button>
              </div>
            </header>
            <div className="flex-1 overflow-auto">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PortalProvider>
  );
}
