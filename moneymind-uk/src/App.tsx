import { useEffect } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useProgress } from "./lib/storage";
import { modules } from "./content/modules";
import { UK_FIGURES } from "./content/constants";
import { moneyFoundBadgeIds } from "./content/badges";
import { getModuleStatus, isGraduate, GRADUATE_BADGE_ID } from "./lib/gamification";
import { NavBar } from "./components/NavBar";
import { PageContainer } from "./components/PageContainer";
import { Button } from "./components/Button";
import { RewardProvider, ProgressRewards } from "./components/Reward";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ModulePage } from "./features/module/ModulePage";
import { PersonaSelect } from "./features/onboarding/PersonaSelect";
import { RightsPage } from "./features/rights/RightsPage";
import { HelpPage } from "./features/help/HelpPage";
import { AboutPage } from "./features/about/AboutPage";

export default function App() {
  const [progress, updaters] = useProgress();
  const { bumpStreak, awardBadge } = updaters;

  // Count today's visit towards the daily streak (idempotent per local day).
  useEffect(() => {
    bumpStreak();
  }, [bumpStreak]);

  // Reconcile badges whenever progress changes. Each award is idempotent, so
  // this converges and never loops. (Quests award their own badges directly;
  // here we cover module-completion, money-found milestones and graduation.)
  useEffect(() => {
    for (const m of modules) {
      if (getModuleStatus(m.id, progress) === "complete") awardBadge(m.badge.id);
    }
    for (const id of moneyFoundBadgeIds(progress.moneyFound)) awardBadge(id);
    if (isGraduate(progress)) awardBadge(GRADUATE_BADGE_ID);
  }, [progress, awardBadge]);

  return (
    <RewardProvider>
      <ProgressRewards progress={progress} />
      <div className="flex min-h-screen flex-col">
      <NavBar progress={progress} />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              progress.onboarded ? (
                <Dashboard progress={progress} />
              ) : (
                <Navigate to="/start" replace />
              )
            }
          />
          <Route path="/start" element={<PersonaSelect updaters={updaters} />} />
          <Route path="/module/:slug" element={<ModulePage progress={progress} updaters={updaters} />} />
          <Route path="/rights" element={<RightsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/about" element={<AboutPage progress={progress} updaters={updaters} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      </div>
    </RewardProvider>
  );
}

function NotFound() {
  return (
    <PageContainer className="py-20 text-center">
      <h1 className="text-3xl font-bold text-navy-900">Page not found</h1>
      <p className="mt-2 text-navy-500">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </PageContainer>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-navy-100 bg-white">
      <PageContainer className="flex flex-col gap-3 py-8 text-sm text-navy-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-navy-700">MoneyMind UK</span> — free money &amp; rights
          education. General information for the {UK_FIGURES.taxYear} tax year, not regulated advice.
        </p>
        <nav className="flex gap-4">
          <Link to="/rights" className="hover:text-navy-800">Your Rights</Link>
          <Link to="/help" className="hover:text-navy-800">Find Help</Link>
          <Link to="/about" className="hover:text-navy-800">About</Link>
        </nav>
      </PageContainer>
    </footer>
  );
}
