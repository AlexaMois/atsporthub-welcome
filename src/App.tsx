import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const DocumentListPage = lazy(() => import("./pages/portal/DocumentListPage"));
const DocumentPage = lazy(() => import("./pages/portal/DocumentPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/director" element={<PasswordPage />} />
            <Route path="/dashboard/director" element={<PortalLayout />}>
              <Route index element={<DocumentListPage />} />
              <Route path="doc/:docId" element={<DocumentPage />} />
            </Route>
            <Route path="/role/:roleName" element={<PortalLayout />}>
              <Route index element={<DocumentListPage />} />
              <Route path="doc/:docId" element={<DocumentPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
