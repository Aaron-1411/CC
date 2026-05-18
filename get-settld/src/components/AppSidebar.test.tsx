import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { PILLARS } from "@/lib/pillars";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <AppSidebar />
        <Routes>
          <Route path="*" element={<div data-testid="loc">{path}</div>} />
        </Routes>
      </SidebarProvider>
    </MemoryRouter>,
  );
}

describe("AppSidebar", () => {
  it("renders a labelled group for every pillar plus Saved", () => {
    renderAt("/");
    const labels = ["Verdict", "Affordability", "Area", "Property", "Risk", "Plan", "Saved"];
    for (const l of labels) expect(screen.getByText(l)).toBeInTheDocument();
  });

  it("renders the primary link for every pillar with the correct href", () => {
    renderAt("/");
    for (const p of PILLARS) {
      const links = screen.getAllByRole("link", { name: new RegExp(esc(p.title), "i") });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].getAttribute("href")).toBe(p.to);
    }
  });

  it("reveals every advanced sub-link after clicking Show advanced", () => {
    renderAt("/");
    // Click every "Show N advanced" toggle.
    const toggles = screen.getAllByRole("button", { name: /show \d+ advanced/i });
    toggles.forEach((b) => fireEvent.click(b));

    for (const p of PILLARS) {
      for (const m of p.more) {
        const link = screen.getByRole("link", { name: new RegExp(esc(m.title), "i") });
        expect(link.getAttribute("href")).toBe(m.to);
      }
    }
  }, 15000);

  it("highlights the active route via aria-current/data-active", () => {
    // Pick a representative route from each pillar (primary + a sub if available).
    const cases: string[] = [];
    for (const p of PILLARS) {
      cases.push(p.to);
      if (p.more[0]) cases.push(p.more[0].to);
    }
    cases.push("/shortlist");

    for (const path of cases) {
      const { unmount } = renderAt(path);
      // Expand all advanced groups so sub links are mounted.
      screen
        .queryAllByRole("button", { name: /show \d+ advanced/i })
        .forEach((b) => fireEvent.click(b));

      const matches = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href") === path);
      expect(matches.length, `no link for ${path}`).toBeGreaterThan(0);
      const active = matches.find(
        (a) => a.getAttribute("aria-current") === "page" || a.getAttribute("data-active") === "true",
      );
      expect(active, `active state missing for ${path}`).toBeTruthy();
      unmount();
    }
  });
});
