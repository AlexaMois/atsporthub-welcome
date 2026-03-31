import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import UserProtectedRoute from "@/components/UserProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const PortalLayout = lazy(() => import("./components/portal/PortalLayout"));
const DocumentListPage = lazy(() => import("./pages/portal/DocumentListPage"));
const DocumentPage = lazy(() => import("./pages/portal/DocumentPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Портал сотрудников */}
            <Route
              path="/portal"
              element={
                <UserProtectedRoute>
                  <PortalLayout />
                </UserProtectedRoute>
              }
            >
              <Route index element={<DocumentListPage />} />
              <Route path="doc/:docId" element={<DocumentPage />} />
            </Route>

            {/* Портал директора — тот же layout, но отдельный раздел */}
            <Route
              path="/dashboard/director"
              element={
                <UserProtectedRoute>
                  <PortalLayout />
                </UserProtectedRoute>
              }
            >
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
