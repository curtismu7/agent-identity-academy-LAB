// What the Help dialog says. Plain, and as hedged as the rest of the lab (rule 2): what was measured, what is simulated, what is UNVERIFIED.
export const HELP_SECTIONS = [
  {
    heading: "What this lab is",
    body: [
      "Agent Identity Academy is a teaching deck: 13 lessons, one per agent type and per control — who the agent is, who owns it, how it authenticates, what policy lets it do, and how governance proves it. Every lesson answers the same five stages: Discover, Register, Authenticate, Authorize, Govern.",
      "The header line says it: everything simulated, no tenant, no outbound network. Tokens and claims are mock samples."
    ]
  },
  {
    heading: "What is simulated, and what is UNVERIFIED",
    body: [
      "Simulated: every token, claim, consent, CIBA prompt and Privilege door in every lesson. Evidence panels are labelled \"MOCK · sample claims\".",
      "UNVERIFIED: nothing here checks a real tenant. Lesson 4's CIMD is mocked because PingOne does not support it yet. Claim diffs, exchange shapes and stage names follow the standards (OIDC, RFC 8693, CIBA, A2A) as this lab models them — treat them as teaching devices, not product behaviour."
    ]
  },
  {
    heading: "How to use the page",
    body: [
      "1. Pick a lesson in the left rail (\"Customer journey · 13 lessons\"); each shows its taxonomy and category.",
      "2. Read \"The actors and the trust boundary\" and the Request line.",
      "3. In \"Run the lesson\", press \"Run mock\" — the Agent movie reel advances one frame every ~2 seconds. \"‹ Prev\" / \"Next ›\" step frames by hand; click any frame to inspect it.",
      "4. The evidence panel shows tokens in play, a What changed claim diff (Before / After), and the request and response at that hop.",
      "5. \"Evidence to product map\" names the Ping product or standard behind each frame.",
      "6. Journey in the header nav scrolls to the pattern diagram."
    ]
  },
  {
    heading: "Mode honesty",
    body: [
      "The header badge names the mode the server answered with. The mode menu may offer Real; if the lab has no real source, a switch is refused with the server's reason. The page's own text never changes: it stays a mock."
    ]
  },
  {
    heading: "Things to leave with",
    body: [
      "Delegation is not impersonation: sub stays the person, act names the agent, scope narrows. The model cannot manufacture authority: policy and the gateway decide, and every decision leaves evidence. Multi-agent hops narrow, never widen."
    ]
  }
];
