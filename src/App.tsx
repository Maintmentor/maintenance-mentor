import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import DashboardPage from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import Contact from "./pages/Contact";
import VideoLibraryPage from "./pages/VideoLibraryPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import KnowledgeBase from "./pages/KnowledgeBase";
import ArticleDetail from "./pages/ArticleDetail";
import ImageTestPage from "./pages/ImageTest";
import VideoAnalysis from "./pages/VideoAnalysis";
import EdgeFunctionTest from "./pages/EdgeFunctionTest";
import EnvSetup from "./pages/EnvSetup";
import { BillingDashboard } from "./components/billing/BillingDashboard";
import ComingSoon from "./components/ComingSoon";
import { BarChart3 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/billing" element={<BillingDashboard />} />
                <Route path="/analytics" element={
                  <div className="min-h-screen bg-gray-50 py-12">
                    <div className="max-w-4xl mx-auto px-4">
                      <ComingSoon
                        title="Analytics Coming Soon"
                        description="View detailed analytics."
                        icon={<BarChart3 className="h-12 w-12 text-white" />}
                      />
                    </div>
                  </div>
                } />
                <Route path="/video-library" element={<VideoLibraryPage />} />
                <Route path="/video/:videoId" element={<VideoPlayerPage />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/knowledge-base/:slug" element={<ArticleDetail />} />
                <Route path="/image-test" element={<ImageTestPage />} />
                <Route path="/video-analysis" element={<VideoAnalysis />} />
                <Route path="/edge-function-test" element={<EdgeFunctionTest />} />
                <Route path="/env-setup" element={<EnvSetup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
