/**
 * Additional E2E coverage for the mobile bottom navigation:
 *  - Loading, unauthenticated, and error states still render the bottom nav
 *    and keep its active highlight in sync.
 *  - Each link (and the More-sheet pillar links) fires the expected
 *    `trackTool` analytics call.
 *  - Navigation preserves query params (e.g. ?property=123, ?region=london).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import ErrorBoundary from "./ErrorBoundary";
import { PILLARS } from "@/lib/pillars";

const trackToolMock = vi.fn();
const logActionMock = vi.fn();

vi.mock("@/lib/audit", () => ({
  trackTool: (...a: unknown[]) => trackToolMock(...a),
  logAction: (...a: unknown[]) => logActionMock(...a),
}));

const useAuthMock = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => useAuthMock(),
}));
vi.mock("@/components/ScenarioBar", () => ({ default: () => null }));
vi.mock("@/components/Breadcrumbs", () => ({ default: () => null }));
vi.mock("@/components/NextStepCTA", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/CookieBanner", () => ({ default: () => null }));
vi.mock("@/lib/shortlist", () => ({ migrateLocalToRemote: () => Promise.resolve(0) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => true }));
vi.mock("@/hooks/use-mobile.tsx", () => ({ useIsMobile: () => true }));

function PageStub() {
  const { pathname, search } = useLocation();
  return <div data-testid="page" data-path={pathname} data-search={search} />;
}

function ExplodingPage(): JSX.Element {
  throw new Error("boom");
}

function renderApp(initial: string, opts: { explodeAt?: string } = {}) {
  const routes = new Set<string>(["/", "/areas", "/shortlist", "/decide"]);
  for (const p of PILLARS) {
    routes.add(p.to);
    p.more.forEach((m) => routes.add(m.to));
  }
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<PageStub />} />
          {[...routes].map((path) => (
            <Route
              key={path}
              path={path}
              element={
                opts.explodeAt === path ? (
                  <ErrorBoundary>
                    <ExplodingPage />
                  </ErrorBoundary>
                ) : (
                  <PageStub />
                )
              }
            />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

const bottomNav = () => screen.getByRole("navigation", { name: /primary/i });

describe("MobileBottomNav — auth/loading/error states", () => {
  beforeEach(() => {
    cleanup();
    trackToolMock.mockReset();
    logActionMock.mockReset();
    useAuthMock.mockReset();
  });

  it("renders bottom nav while auth is loading and keeps active link highlighted", () => {
    useAuthMock.mockReturnValue({ user: null, loading: true, signOut: vi.fn() });
    renderApp("/areas");
    const link = within(bottomNav()).getByRole("link", { name: /areas/i });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("renders bottom nav for unauthenticated users with the right active state", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
    renderApp("/decide");
    expect(within(bottomNav()).getByRole("link", { name: /decide/i }).getAttribute("aria-current")).toBe(
      "page",
    );
    // No telemetry should fire just from rendering.
    expect(trackToolMock).not.toHaveBeenCalled();
  });

  it("keeps bottom nav usable after a page-level error is caught by ErrorBoundary", () => {
    useAuthMock.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
    // Suppress React's error-boundary console noise.
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderApp("/areas", { explodeAt: "/areas" });
    // Bottom nav still mounted.
    expect(bottomNav()).toBeInTheDocument();
    // Active highlight still on Areas (current pathname).
    expect(within(bottomNav()).getByRole("link", { name: /areas/i }).getAttribute("aria-current")).toBe(
      "page",
    );
    // The other links remain navigable.
    fireEvent.click(within(bottomNav()).getByRole("link", { name: /saved/i }));
    expect(screen.getByTestId("page").getAttribute("data-path")).toBe("/shortlist");
    errSpy.mockRestore();
  });
});

describe("MobileBottomNav — analytics tracking", () => {
  beforeEach(() => {
    cleanup();
    trackToolMock.mockReset();
    useAuthMock.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
  });

  it.each([
    { label: "Areas", slug: "nav.areas" },
    { label: "Saved", slug: "nav.shortlist" },
    { label: "Decide", slug: "nav.decide" },
  ])("clicking $label fires trackTool($slug)", ({ label, slug }) => {
    renderApp("/");
    fireEvent.click(within(bottomNav()).getByRole("link", { name: new RegExp(label, "i") }));
    const calls = trackToolMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain(slug);
  });

  it("opening the More sheet fires trackTool('nav.more-sheet')", () => {
    renderApp("/");
    fireEvent.click(within(bottomNav()).getByRole("button", { name: /open all tools/i }));
    expect(trackToolMock.mock.calls.map((c) => c[0])).toContain("nav.more-sheet");
  });

  it("clicking a pillar link inside the More sheet fires its sidebar nav.* event", () => {
    renderApp("/");
    fireEvent.click(within(bottomNav()).getByRole("button", { name: /open all tools/i }));
    const dialog = screen.getByRole("dialog");
    const target = PILLARS[1]; // Affordability -> /mortgage
    const link = within(dialog)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.startsWith(target.to))!;
    fireEvent.click(link);
    const calls = trackToolMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain(`nav.${target.to.slice(1)}`);
  });
});

describe("Navigation — query parameter preservation", () => {
  beforeEach(() => {
    cleanup();
    trackToolMock.mockReset();
    useAuthMock.mockReturnValue({ user: null, loading: false, signOut: vi.fn() });
  });

  it("bottom-nav clicks preserve the current search params", () => {
    renderApp("/areas?region=london&filter=schools");
    fireEvent.click(within(bottomNav()).getByRole("link", { name: /saved/i }));
    const page = screen.getByTestId("page");
    expect(page.getAttribute("data-path")).toBe("/shortlist");
    expect(page.getAttribute("data-search")).toBe("?region=london&filter=schools");
  });

  it("More-sheet pillar clicks preserve the current search params", () => {
    renderApp("/areas?property=123");
    fireEvent.click(within(bottomNav()).getByRole("button", { name: /open all tools/i }));
    const dialog = screen.getByRole("dialog");
    const target = PILLARS[3]; // Property -> /avm
    const link = within(dialog)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href")?.startsWith(target.to))!;
    fireEvent.click(link);
    const page = screen.getByTestId("page");
    expect(page.getAttribute("data-path")).toBe(target.to);
    expect(page.getAttribute("data-search")).toBe("?property=123");
  });
});
