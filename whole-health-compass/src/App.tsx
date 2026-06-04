import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { clinicConfig } from "@/config/clinic";
import { applyClinicTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Landing } from "@/pages/Landing";
import { Compass } from "@/pages/Compass";
import { About } from "@/pages/About";
import { Privacy } from "@/pages/Privacy";
import { ForClinics } from "@/pages/ForClinics";
import { Compliance } from "@/pages/Compliance";
import { Clinic } from "@/pages/Clinic";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    applyClinicTheme({ primary: clinicConfig.primaryColor, accent: clinicConfig.accentColor });
    document.title = `${clinicConfig.name} — ${clinicConfig.tagline}`;
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/compass" element={<Compass />} />
            <Route path="/for-clinics" element={<ForClinics />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/clinic" element={<Clinic />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
}
