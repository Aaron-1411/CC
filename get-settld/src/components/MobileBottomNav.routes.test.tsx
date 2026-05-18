/**
 * End-to-end style tests for the mobile bottom navigation.
 *
 * Renders AppLayout at a mobile viewport, walks every link in MobileBottomNav,
 * and verifies that:
 *   1. The correct page renders for each link.
 *   2. The clicked link is marked active.
 *   3. The "More" button opens the mobile sidebar sheet so all tools remain reachable.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./AppLayout";
import { PILLARS } from "@/lib/pillars";

function PageStub() {
  const { pathname } = useLocation();
  return <div data-testid="page" data-path={pathname}>{pathname}</div>;
}

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false, signOut: vi.fn() }),
}));
vi.mock("@/components/ScenarioBar", () => ({ default: () => null }));
vi.mock("@/components/Breadcrumbs", () => ({ default: () => null }));
vi.mock("@/components/NextStepCTA", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/CookieBanner", () => ({ default: () => null }));
vi.mock("@/lib/audit", () => ({ trackTool: vi.fn(), logAction: vi.fn() }));
vi.mock("@/lib/shortlist", () => ({ migrateLocalToRemote: () => Promise.resolve(0) }));

// Force the mobile breakpoint so MobileBottomNav is interactive and the
// sidebar uses its mobile Sheet variant.
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}));
vi.mock("@/hooks/use-mobile.tsx", () => ({
  useIsMobile: () => true,
}));

function renderApp(initial: string) {
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
            <Route key={path} path={path} element={<PageStub />} />
          ))}
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function bottomNav() {
  return screen.getByRole("navigation", { name: /primary/i });
}

const PRIMARY = [
  { label: "Areas", path: "/areas" },
  { label: "Saved", path: "/shortlist" },
  { label: "Decide", path: "/decide" },
];

describe("MobileBottomNav end-to-end", () => {
  beforeEach(() => cleanup());

  it.each(PRIMARY)("clicking $label navigates to $path and highlights it active", ({ label, path }) => {
    renderApp("/");
    const nav = bottomNav();
    const link = within(nav).getByRole("link", { name: new RegExp(label, "i") });
    fireEvent.click(link);

    expect(screen.getByTestId("page").getAttribute("data-path")).toBe(path);

    // After navigation, the same link in the bottom nav should be marked active.
    const active = within(bottomNav()).getByRole("link", { name: new RegExp(label, "i") });
    // NavLink applies aria-current="page" when active.
    expect(active.getAttribute("aria-current")).toBe("page");
  });

  it.each(PRIMARY)("renders $label as already-active when started at $path", ({ label, path }) => {
    renderApp(path);
    const link = within(bottomNav()).getByRole("link", { name: new RegExp(label, "i") });
    expect(link.getAttribute("aria-current")).toBe("page");
  });

  it("More button opens the mobile sidebar sheet exposing every pillar link", () => {
    renderApp("/");
    const more = within(bottomNav()).getByRole("button", { name: /open all tools/i });
    fireEvent.click(more);

    // The mobile sidebar Sheet is a dialog containing all pillar links.
    const dialog = screen.getByRole("dialog");
    for (const p of PILLARS) {
      const matches = within(dialog)
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href") === p.to);
      expect(matches.length, `missing sidebar link to ${p.to}`).toBeGreaterThan(0);
    }
  });

  it("clicking a pillar inside the More sheet navigates to that page", () => {
    renderApp("/");
    fireEvent.click(within(bottomNav()).getByRole("button", { name: /open all tools/i }));
    const dialog = screen.getByRole("dialog");
    const target = PILLARS[1]; // Affordability -> /mortgage
    const link = within(dialog)
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === target.to)!;
    fireEvent.click(link);
    expect(screen.getByTestId("page").getAttribute("data-path")).toBe(target.to);
  });
});
