/**
 * The full tool directory. Single source of truth for the /tools browse page
 * and the footer/nav "all tools" links — so the homepage no longer needs to
 * carry the whole grid.
 */

export type ToolEntry = { to: string; label: string; copy: string };
export type ToolSection = { label: string; tools: ToolEntry[] };

export const TOOL_SECTIONS: ToolSection[] = [
  {
    label: "Start here",
    tools: [
      { to: "/issues", label: "Issues", copy: "The big topics, by the numbers" },
      { to: "/parties", label: "Party pledges", copy: "Are they keeping their word?" },
      { to: "/learn", label: "Learn", copy: "How UK democracy actually works" },
      { to: "/take-action", label: "Take action", copy: "How to make your voice heard" },
      { to: "/my-area", label: "My area", copy: "Your MP, your constituency" },
    ],
  },
  {
    label: "Politics & democracy",
    tools: [
      { to: "/parliament", label: "Bills", copy: "Legislation in Parliament" },
      { to: "/votes", label: "Votes", copy: "How MPs actually vote" },
      { to: "/petitions", label: "Petitions", copy: "Most-signed open petitions" },
      { to: "/committees", label: "Committees", copy: "Select committee reports" },
      { to: "/news", label: "Coverage", copy: "What outlets are amplifying" },
    ],
  },
  {
    label: "Economy & spending",
    tools: [
      { to: "/economy", label: "Indicators", copy: "GDP, inflation, wages & debt" },
      { to: "/spending", label: "Public spending", copy: "Where public money goes" },
    ],
  },
  {
    label: "Follow the money",
    tools: [
      { to: "/contracts", label: "Contracts", copy: "Search major public contracts" },
      { to: "/donations", label: "Donations", copy: "Who funds the parties" },
      { to: "/expenses", label: "MP expenses", copy: "What MPs are claiming" },
      { to: "/meetings", label: "Ministers", copy: "Who ministers are meeting" },
      { to: "/lobbying", label: "Lobbying", copy: "Paid influence register" },
      { to: "/acoba", label: "Revolving Door", copy: "Ministers to private sector" },
    ],
  },
  {
    label: "Public services",
    tools: [
      { to: "/nhs", label: "NHS", copy: "Waiting times & A&E performance" },
      { to: "/sewage", label: "Sewage", copy: "Water company discharge hours" },
      { to: "/stop-search", label: "Policing", copy: "Stop & search disparity data" },
      { to: "/sanctions", label: "Sanctions", copy: "Benefits conditionality data" },
      { to: "/foi", label: "FOI", copy: "Who withholds the most info" },
    ],
  },
  {
    label: "Investigate",
    tools: [
      { to: "/crossref", label: "Cross-reference", copy: "Search every database at once" },
      { to: "/projects", label: "Major projects", copy: "HS2, Hinkley & cost overruns" },
      { to: "/briefing", label: "AI briefing", copy: "Non-partisan topic briefings" },
      { to: "/methodology", label: "Methodology", copy: "How we judge and source" },
    ],
  },
];

export const TOTAL_TOOLS = TOOL_SECTIONS.reduce((n, s) => n + s.tools.length, 0);
