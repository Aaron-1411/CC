import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScenarioProvider } from "@/context/ScenarioContext";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import { LoadingState } from "./components/states";

// Eager: shell + landing path users hit first
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound.tsx";

// Lazy: every other route — keeps initial JS small for SEO + mobile.
const Mortgage = lazy(() => import("./pages/Mortgage"));
const Areas = lazy(() => import("./pages/Areas"));
const Properties = lazy(() => import("./pages/Properties"));
const Journey = lazy(() => import("./pages/Journey"));
const Appreciation = lazy(() => import("./pages/Appreciation"));
const Report = lazy(() => import("./pages/Report"));
const Deposit = lazy(() => import("./pages/Deposit"));
const TrueCost = lazy(() => import("./pages/TrueCost"));
const Schemes = lazy(() => import("./pages/Schemes"));
const RiskReport = lazy(() => import("./pages/RiskReport"));
const OfferStrategy = lazy(() => import("./pages/OfferStrategy"));
const Viewings = lazy(() => import("./pages/Viewings"));
const DataTwin = lazy(() => import("./pages/DataTwin"));
const Avm = lazy(() => import("./pages/Avm"));
const RightFit = lazy(() => import("./pages/RightFit"));
const Investment = lazy(() => import("./pages/Investment"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Shortlist = lazy(() => import("./pages/Shortlist"));
const Phase = lazy(() => import("./pages/Phase"));
const Decide = lazy(() => import("./pages/Decide"));
const Mip = lazy(() => import("./pages/Mip"));
const CoBuyer = lazy(() => import("./pages/CoBuyer"));
const Alerts = lazy(() => import("./pages/Alerts"));
const LeaseAnalysis = lazy(() => import("./pages/LeaseAnalysis"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Contact = lazy(() => import("./pages/Contact"));
const Methodology = lazy(() => import("./pages/Methodology"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminGate = lazy(() => import("./pages/AdminGate"));
const Receipt = lazy(() => import("./pages/Receipt"));
const BeatTheAgent = lazy(() => import("./pages/BeatTheAgent"));
const Outcomes = lazy(() => import("./pages/Outcomes"));
const ViewingMode = lazy(() => import("./pages/ViewingMode"));
const Broker = lazy(() => import("./pages/Broker"));
const BrokerView = lazy(() => import("./pages/BrokerView"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Remortgage = lazy(() => import("./pages/Remortgage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Faqs = lazy(() => import("./pages/Faqs"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideArticle = lazy(() => import("./pages/GuideArticle"));
const Calculator = lazy(() => import("./pages/Calculator"));
const CalculatorEmbed = lazy(() => import("./pages/CalculatorEmbed"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
    <LoadingState label="Loading…" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <ScenarioProvider>
          <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/mortgage" element={<Mortgage />} />
              <Route path="/areas" element={<Areas />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/appreciation" element={<Appreciation />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/true-cost" element={<TrueCost />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/risk" element={<RiskReport />} />
              <Route path="/offer" element={<OfferStrategy />} />
              <Route path="/viewings" element={<Viewings />} />
              <Route path="/data-twin" element={<DataTwin />} />
              <Route path="/avm" element={<Avm />} />
              <Route path="/right-fit" element={<RightFit />} />
              <Route path="/investment" element={<Investment />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/shortlist" element={<Shortlist />} />
              <Route path="/start/:phase" element={<Phase />} />
              <Route path="/decide" element={<Decide />} />
              <Route path="/mip" element={<Mip />} />
              <Route path="/co-buyer" element={<CoBuyer />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/lease" element={<LeaseAnalysis />} />
              <Route path="/methodology" element={<Methodology />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
              <Route path="/__admin" element={<AdminGate />} />
              <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="/v/:slug" element={<Receipt />} />
              <Route path="/beat-the-agent" element={<BeatTheAgent />} />
              <Route path="/outcomes" element={<Outcomes />} />
              <Route path="/viewing-mode" element={<ViewingMode />} />
              <Route path="/broker" element={<Broker />} />
              <Route path="/broker/:code" element={<BrokerView />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/remortgage" element={<Remortgage />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/faqs" element={<Faqs />} />
              <Route path="/glossary" element={<Glossary />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideArticle />} />
              <Route path="/calculator" element={<Calculator />} />
            </Route>
            <Route path="/embed/calculator" element={<CalculatorEmbed />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </ScenarioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
