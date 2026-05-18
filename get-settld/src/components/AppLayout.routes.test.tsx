/**
 * End-to-end style routing tests.
 *
 * Renders the real AppLayout (sidebar + header + outlet) inside a MemoryRouter
 * and walks every sidebar destination — primary pillars, advanced sub-tools and
 * the Saved shortlist — asserting that:
 *   1. Navigation lands on the expected route (Outlet renders the matching page stub).
 *   2. The corresponding sidebar link is marked active (aria-current="page" or data-active="true").
 *
 * Page components are stubbed so the tests focus purely on routing + active state
 * without pulling in Supabase, charts, etc.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import { PILLARS } from "@/lib/pillars";

// Stub page that announces the current pathname so we can verify navigation.
function PageStub({ name }: { name: string }) {
  const { pathname } = useLocation();
  return (
    <div data-testid="page" data-path={pathname}>
      {name}
    </div>
  );
}

// Mock heavy peripheral components so AppLayout renders cleanly in jsdom.
vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/components/ScenarioBar", () => ({ default: () => null }));
vi.mock("@/components/Breadcrumbs", () => ({ default: () => null }));
vi.mock("@/components/NextStepCTA", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/CookieBanner", () => ({ default: () => null }));
vi.mock("@/components/MobileBottomNav", () => ({ default: () => null }));
vi.mock("@/lib/audit", () => ({ trackTool: vi.fn(), logAction: vi.fn() }));
vi.mock("@/lib/shortlist", () => ({ migrateLocalToRemote: () => Promise.resolve(0) }));

function renderApp(initial: string) {
  // Build a Route entry for every sidebar destination using stubs.
  const routes = new Set<string>(["/shortlist"]);
  for (const p of PILLARS) {
    routes.add(p.to);
    p.more.forEach((m) => routes.add(m.to));
  }

  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<PageStub name="/" />} />
          {[...routes].map((path) => (
            <Route key={path} path={path} element={<PageStub name={path} />} />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function expandAdvanced() {
  screen
    .queryAllByRole("button", { name: /show \d+ advanced/i })
    .forEach((b) => fireEvent.click(b));
}

function activeLinkFor(path: string) {
  const matches = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === path);
  return matches.find(
    (a) => a.getAttribute("aria-current") === "page" || a.getAttribute("data-active") === "true",
  );
}

// All destinations the sidebar exposes, flattened.
const ALL_ROUTES: string[] = (() => {
  const out: string[] = [];
  for (const p of PILLARS) {
    out.push(p.to);
    p.more.forEach((m) => out.push(m.to));
  }
  out.push("/shortlist");
  return out;
})();

describe("Sidebar end-to-end routing", () => {
  beforeEach(() => cleanup());

  it.each(ALL_ROUTES)("navigates to %s and renders its page", (path) => {
    renderApp(path);
    const page = screen.getByTestId("page");
    expect(page.getAttribute("data-path")).toBe(path);
  });

  it.each(ALL_ROUTES)("highlights the sidebar link for %s as active", (path) => {
    renderApp(path);
    expandAdvanced();
    expect(activeLinkFor(path), `expected active sidebar link for ${path}`).toBeTruthy();
  });

  it("clicking a sidebar link navigates and updates the active highlight", () => {
    renderApp("/");
    // Click the Affordability primary link.
    const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href") === "/mortgage");
    fireEvent.click(links[0]);
    expect(screen.getByTestId("page").getAttribute("data-path")).toBe("/mortgage");
    expect(activeLinkFor("/mortgage")).toBeTruthy();
  });
});
