import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/dom";
import App from "./App";

// The header shows this lab's own Verified / In progress mark, read from the same /api/shelf call the Shelf link makes (through the lab-proxy that
// call reaches the shelf, whose payload lists every demo with its mark). The lab's own /api/shelf has only { shelfUrl }, so there is no mark then.
const mark = (status, label, extra = {}) => ({ status, label, note: "", updatedAt: "2026-11-15", source: "shipped", ...extra });

const STAGES = [
  { id: "discover", label: "Discover", question: "q1" },
  { id: "register", label: "Register", question: "q2" },
  { id: "authenticate", label: "Authenticate", question: "q3" },
  { id: "authorize", label: "Authorize", question: "q4" },
  { id: "govern", label: "Govern", question: "q5" },
];

const STORY = {
  title: "Agent Identity Academy", intro: "Walk each lesson frame by frame.", banner: "SIMULATION: b", realBanner: "REAL MODE: this lab has no live mode — the content stays simulated.",
  stages: STAGES,
  lessons: [
    { id: "landscape", nav: "Agent landscape", category: "Foundation", taxonomy: "CIAM and Workforce", title: "Agent Landscape and Identity", description: "d", outcome: "o",
      stages: ["discover", "register"], request: "r", scenario: "s", scenarioCopy: "sc", presenter: "p",
      actors: [["Person", "Customer", "Owns intent"], ["Boundary", "IAM core", "Registers"]],
      products: ["Agent Discovery"], frameProducts: ["A", "B", "C", "D"], diagram: "aia-landscape",
      frames: [
        ["discover", "Observe", "narrative", "state=x"],
        ["discover", "Classify", "narrative", "state=y"],
        ["register", "Relate", "narrative", "state=z"],
        ["register", "Boundary", "narrative", "state=w"],
      ] },
  ],
  journeyDiagram: "aia-stage-model",
  talkTrack: [{ title: "tt", say: "say" }],
};

const DIAGRAM = {
  title: "aia-landscape", intro: "d",
  groups: { g1: "Customer", g2: "Boundary" },
  nodes: [{ id: "a", label: "A", kind: "g1", x: 0, y: 0 }, { id: "b", label: "B", kind: "g2", x: 300, y: 0 }],
  steps: [{ from: "a", to: "b", label: "calls", say: "A calls B." }],
};

function stubFetch({ shelfPayload, story = STORY, info } = {}) {
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
    if (url === "/api/shelf") return json(shelfPayload ?? { shelfUrl: "https://shelf.example" });
    if (url === "/api/info") return json(info ?? { mode: "mock", source: "mock", simulated: true, realAvailable: false, realHint: "set AIA_MODE_REAL=1 in .env", title: "Agent Identity Academy", version: "0.1.0" });
    if (url === "/api/story") return json(story);
    if (url.startsWith("/api/diagram")) return json(DIAGRAM);
    if (url === "/api/mode") {
      return json({ error: "real_not_configured" }, 409);
    }
    if (url === "/api/reset") return json({ ok: true });
    return json({}, 404);
  });
}

beforeEach(() => { window.location.hash = ""; });
afterEach(() => { cleanup(); sessionStorage.clear(); });

describe("verification mark in the header", () => {
  it("shows this lab's own mark beside the Shelf link, and no other lab's", async () => {
    stubFetch({ shelfPayload: { shelfUrl: "https://shelf.example", demos: [
      { id: "other-lab", verification: mark("in-progress", "In progress") },
      { id: "agent-identity-academy", verification: mark("verified", "Verified") },
    ] } });
    render(<App />);
    const bar = await screen.findByTestId("top-menu");
    expect(await within(bar).findByText("Verified")).toBeTruthy();
    expect(within(bar).queryByText("In progress")).toBeNull();
  });

  it("shows nothing when the lab is opened on its own port (only { shelfUrl }), or when the shelf has no mark for it", async () => {
    stubFetch({});
    render(<App />);
    const bar = await screen.findByTestId("top-menu");
    await within(bar).findByText("Shelf");
    expect(within(bar).queryByText("Verified")).toBeNull();

    stubFetch({ shelfPayload: { shelfUrl: "https://shelf.example", demos: [{ id: "other-lab", verification: mark("verified", "Verified") }] } });
    render(<App />);
    const bar2 = await screen.findByTestId("top-menu");
    await within(bar2).findByText("Shelf");
    expect(within(bar2).queryByText("Verified")).toBeNull();
  });
});

describe("the rule-19 Mock/Real toggle", () => {
  it("the page opens on a MOCK modal that says what is simulated, with no banner, and Got it closes it for the rest of the session", async () => {
    stubFetch({});
    const { unmount } = render(<App />);
    const modal = await screen.findByTestId("mode-modal");
    expect(modal.dataset.mode).toBe("mock");
    expect(modal.textContent).toMatch(/MOCK/);
    expect(modal.textContent).toMatch(/labelled mock value/);
    expect(modal.textContent).toMatch(/no outbound network/i);
    expect(modal.textContent).toMatch(/no token is issued or read/);
    // the old banner is gone, and the intro paragraph it used to carry is still on the page
    expect(screen.queryByTestId("banner")).toBeNull();
    expect(screen.queryByTestId("sim-banner")).toBeNull();
    expect(screen.queryByTestId("real-banner")).toBeNull();
    expect(document.querySelector(".banner")).toBeNull();
    expect(await screen.findByText(STORY.intro)).toBeTruthy();
    // and a lesson actually renders
    expect(await screen.findByTestId("trust-path")).toBeTruthy();
    fireEvent.click(screen.getByTestId("mode-modal-ok"));
    expect(screen.queryByTestId("mode-modal")).toBeNull();
    unmount();
    render(<App />);
    await screen.findByTestId("trust-path");
    expect(screen.queryByTestId("mode-modal")).toBeNull();
  });

  it("when the server reports real the modal says REAL and that the lab has no live mode, so the content is the same simulation", async () => {
    stubFetch({ info: { mode: "real", source: "real", simulated: true, realAvailable: true, realHint: "", title: "Agent Identity Academy", version: "0.1.0" } });
    render(<App />);
    await waitFor(() => expect(screen.getByTestId("mode-modal").dataset.mode).toBe("real"));
    expect(screen.getByTestId("mode-modal").textContent).toMatch(/REAL/);
    expect(screen.getByTestId("mode-modal").textContent).toMatch(/no live mode/i);
    expect(screen.getByTestId("mode-modal").textContent).toMatch(/same simulation/);
  });

  it("Real is disabled with a how-to tooltip when realAvailable is false, and the server's 409 keeps Mock", async () => {
    stubFetch({ info: { mode: "mock", source: "mock", simulated: true, realAvailable: false, realHint: "set AIA_MODE_REAL=1 in .env", title: "Agent Identity Academy", version: "0.1.0" } });
    render(<App />);
    const bar = await screen.findByTestId("top-menu");
    const real = within(bar).getByTestId("mode-real");
    expect(real.disabled).toBe(true);
    expect(real.title).toMatch(/AIA_MODE_REAL/);
    const user = userEvent.setup();
    await user.click(real);
    const badge = await screen.findByTestId("mode-badge");
    expect(badge.textContent).toBe("mock");
  });

  it("Real can be selected when the server reports realAvailable, and the badge follows", async () => {
    stubFetch({ info: { mode: "mock", source: "mock", simulated: true, realAvailable: true, realHint: "", title: "Agent Identity Academy", version: "0.1.0" } });
    // this lab's real mode is still a simulation; the fetch stub answers 200 for the mode switch
    globalThis.fetch = vi.fn(async (url) => {
      const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
      if (url === "/api/shelf") return json({ shelfUrl: "https://shelf.example" });
      if (url === "/api/info") return json({ mode: "mock", source: "mock", simulated: true, realAvailable: true, realHint: "", title: "Agent Identity Academy", version: "0.1.0" });
      if (url === "/api/story") return json(STORY);
      if (url.startsWith("/api/diagram")) return json(DIAGRAM);
      if (url === "/api/mode") return json({ source: "real" });
      if (url === "/api/reset") return json({ ok: true });
      return json({}, 404);
    });
    render(<App />);
    const bar = await screen.findByTestId("top-menu");
    const real = within(bar).getByTestId("mode-real");
    expect(real.disabled).toBe(false);
    const user = userEvent.setup();
    await user.selectOptions(within(bar).getByTestId("mode-select"), "real");
    const badge = await screen.findByTestId("mode-badge");
    expect(badge.textContent).toBe("real");
    // the REAL modal appears (the mode changed, so MOCK being shown first does not hide it) and stays honest
    await waitFor(() => expect(screen.getByTestId("mode-modal").dataset.mode).toBe("real"));
    expect(screen.getByTestId("mode-modal").textContent).toMatch(/no live mode/i);
  });
});

describe("the lesson page", () => {
  it("renders the lesson rail, the stage rail, the filmstrip and the trust path", async () => {
    stubFetch({});
    render(<App />);
    expect(await screen.findByTestId("lesson-list")).toBeTruthy();
    expect(screen.getAllByTestId(/lesson-/).length).toBeGreaterThan(1);
    expect(screen.getByTestId("stage-rail")).toBeTruthy();
    const strip = await screen.findByTestId("filmstrip");
    expect(strip.querySelectorAll(".aca-frame").length).toBe(4);
    expect(screen.getByTestId("trust-path").textContent).toMatch(/Customer/);
    expect(screen.getByTestId("run-panel").textContent).toMatch(/Presenter close/);
  });

  it("Run mock advances the playhead through every frame and ends on the last", { testTimeout: 20_000 }, async () => {
    stubFetch({});
    render(<App />);
    const run = await screen.findByTestId("run-action");
    await userEvent.click(run);
    await waitFor(() => expect(screen.getByTestId("frame-counter").textContent).toBe("2 / 4"), { timeout: 6_000 });
    await waitFor(() => expect(screen.getByTestId("frame-counter").textContent).toBe("4 / 4"), { timeout: 12_000 });
    await waitFor(() => expect(screen.getByTestId("run-action").textContent).toBe("Replay"), { timeout: 15_000 });
    // the evidence drawer shows the final frame's state line
    expect(screen.getByTestId("evidence").textContent).toMatch(/Boundary/);
  });

  it("a manual frame pick opens its evidence, and a frame with a claim diff shows the moved claims", async () => {
    const story = { ...STORY };
    story.lessons = [{
      ...STORY.lessons[0], id: "delegation", nav: "Delegated access", diagram: "aia-delegation",
      frames: [
        ["authenticate", "Customer subject", "n", "s", { fact: "user token held (mock)", fc: "ok", tokens: ["User access token (mock)"], before: null, after: { sub: "customer-1042", scope: "openid accounts:read accounts:transfer" }, req: "GET", res: "200" }],
        ["authorize", "Token exchange", "n", "s", { fact: "scope narrowed 3 → 1", fc: "narrowed", tokens: ["Exchanged token (mock)"], before: { sub: "customer-1042", scope: "openid accounts:read accounts:transfer" }, after: { sub: "customer-1042", scope: "accounts:read", act: "{ \"sub\": \"agent\" }" }, req: "POST", res: "200" }],
        ["authorize", "Two", "n", "s"],
        ["govern", "Three", "n", "s"],
      ],
    }];
    stubFetch({ story });
    render(<App />);
    await screen.findByTestId("trust-path");
    await userEvent.click(screen.getByTestId("frame-1"));
    const evidence = screen.getByTestId("evidence");
    expect(screen.getByTestId("filmstrip").textContent).toMatch(/scope narrowed/);
    const diff = within(evidence).getByTestId("claim-diff");
    expect(diff.textContent).toMatch(/accounts:transfer/);
    expect(diff.textContent).toMatch(/accounts:read/);
    expect(within(evidence).getAllByRole("row", { name: /scope/ })[0].dataset.change).toBe("changed");
  });

  it("Reset clears the playhead and reloads the story", async () => {
    stubFetch({});
    render(<App />);
    await screen.findByTestId("trust-path");
    await userEvent.click(screen.getByTestId("frame-0"));
    expect(screen.getByTestId("frame-counter").textContent).toBe("1 / 4");
    await userEvent.click(screen.getByTestId("reset"));
    await waitFor(() => expect(screen.getByTestId("frame-counter").textContent).toBe("0 / 4"));
  });
});
