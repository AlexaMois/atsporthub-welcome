import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserProtectedRoute from "@/components/UserProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const PasswordPage = lazy(() => import("./pages/PasswordPage"));
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
            {/* Вход по телефону */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Вход для директора по паролю */}
            <Route path="/login/director" element={<PasswordPage />} />

            {/* Портал для обычных сотрудников — защищён проверкой телефона */}
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

            {/* Портал для директора — защищён JWT паролем */}
            <Route
              path="/dashboard/director"
              element={
                <ProtectedRoute>
                  <PortalLayout />
                </ProtectedRoute>
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
