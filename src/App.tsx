import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RolePage from "./pages/RolePage";
import PasswordPage from "./pages/PasswordPage";
import DirectorDashboard from "./pages/DirectorDashboard";
import DocumentPage from "./pages/DocumentPage";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/role/:roleName" element={<RolePage />} />
          <Route path="/login/director" element={<PasswordPage />} />
          <Route path="/dashboard/director" element={<DirectorDashboard />} />
          <Route path="/document/:docId" element={<DocumentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
