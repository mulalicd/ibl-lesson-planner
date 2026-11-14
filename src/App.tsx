import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
// S6 (E-15): each page is loaded when it is opened, so the sign-in page does not download the planner, the plan
// workspace or the Word builder. A page from an older release reloads once (main.tsx, vite:preloadError).
const Index = lazy(() => import("./pages/Index"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const PlanPage = lazy(() => import("./pages/PlanPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
import RequireAuth from "./components/RequireAuth";
import AuthProvider from "./components/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* while a page loads: the empty desk (same background, no spinner, no layout jump) */}
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* the user guide is open to everyone: the sign-in step can be read before signing in */}
            <Route path="/uputstvo" element={<GuidePage />} />
            <Route path="/" element={<RequireAuth><Index /></RequireAuth>} />
            <Route path="/chat" element={<RequireAuth><ChatPage /></RequireAuth>} />
            <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
            <Route path="/plan/:id" element={<RequireAuth><PlanPage /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
