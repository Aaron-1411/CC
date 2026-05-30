import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AnalysisStoreProvider } from "@/hooks/useAnalysisStore";
import Toolbox from "./pages/Toolbox";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Analyze from "./pages/Analyze";
import AnalysisView from "./pages/AnalysisView";
import SharedReport from "./pages/SharedReport";
import LeadFinder from "./pages/LeadFinder";
import SiteRebuilder from "./pages/SiteRebuilder";
import AdLibrary from "./pages/AdLibrary";
import AdGenerator from "./pages/AdGenerator";
import AIVisibility from "./pages/AIVisibility";
import KeywordGap from "./pages/KeywordGap";
import ContentRemix from "./pages/ContentRemix";
import LandingPageAI from "./pages/LandingPageAI";
import CaseStudy from "./pages/CaseStudy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AnalysisStoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Toolbox />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/analyze" element={<Analyze />} />
              <Route path="/analysis/:id" element={<AnalysisView />} />
              <Route path="/report/:shareToken" element={<SharedReport />} />
              <Route path="/leads" element={<LeadFinder />} />
              <Route path="/ads" element={<AdLibrary />} />
              <Route path="/generate" element={<AdGenerator />} />
              <Route path="/rebuild" element={<SiteRebuilder />} />
              <Route path="/rebuild/:id" element={<SiteRebuilder />} />
              <Route path="/ai-visibility" element={<AIVisibility />} />
              <Route path="/keyword-gap" element={<KeywordGap />} />
              <Route path="/content-remix" element={<ContentRemix />} />
              <Route path="/landing-page" element={<LandingPageAI />} />
              <Route path="/case-study" element={<CaseStudy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AnalysisStoreProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
