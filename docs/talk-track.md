# Talk track

<!-- Generated from server/src/story.js by `npm run talk-track`. Do not edit by hand. -->

## What this page is

One lesson per agent type and per control: who the agent is, who owns it, how it authenticates, what policy lets it do, and how governance proves it. Walk each lesson frame by frame and inspect the mock evidence at every hop.

## The beats

1. **Start with classification.** Lesson 1. Before any control: who owns this agent, where does it run, whose authority does it carry. The whole control pattern follows from that answer.
2. **The person proves themselves without leaking a bearer token.** Lesson 2. OIDC with PKCE, the code exchange happens in the BFF, and the browser holds only an HttpOnly cookie. Everything after this hop spends that server-side custody.
3. **Delegation is not impersonation.** Lesson 3. RFC 8693 token exchange: the customer stays the subject, the agent appears as the actor, scope narrows, audience rebinds, lifetime shortens. Read the claim diff.
4. **The Personal Agent lesson.** Lesson 4. An agent we do not control. We control whether it can identify itself, connect, receive consent, and reach each protected tool. CIMD is mocked because PingOne does not support it yet.
5. **The enterprise assistant gets a mandate, not a master key.** Lesson 5. Search within the task mandate; booking pauses for step-up. Enterprise control does not mean unlimited authority.
6. **Discovery is not permission.** Lesson 6. A tool in tools/list is a schema. The later policy decision at the gateway is the execution authority. Two different evidence types.
7. **Policy, not the model, decides.** Lesson 7. Same identities, two actions: the read is permitted, the over-ceiling transfer is denied. The agent cannot argue with a policy decision.
8. **Human approval is a bounded event.** Lesson 8. CIBA or MFA reaches the customer on a channel the agent does not own; the receipt is single-use and replay-rejected. The agent cannot assert consent on the customer’s behalf.
9. **Multi-agent hops narrow, never widen.** Lesson 9. A2A hands the task to a specialist through a nested exchange: the act chain grows, the scope shrinks. Each hop is attributable.
10. **Privileged access stays secretless.** Lesson 10. The Privilege door brokers a time-bound session; the agent gets a result, never the credential.
11. **The model cannot manufacture authority.** Lesson 11. Prompt injection, replay, scope escalation, wrong audience: each stops at a different observable boundary. That is the security property that matters.
12. **Revocation is the proof of governance.** Lesson 12. Detect, register with an owner, revoke, and show the next call failing closed. Blocking one call is not lifecycle management.
13. **Close on evidence.** Lesson 13. Every stage leaves proof: who acted, under whose authority, what was allowed, what happened. Point at the product for each control.

## What to leave with

- Every lesson answers the same five questions: discover, register, authenticate, authorize, govern.
- Delegation is not impersonation: sub stays the person, act names the agent, scope narrows.
- The model cannot manufacture authority; policy and the gateway decide, and every decision leaves evidence.

