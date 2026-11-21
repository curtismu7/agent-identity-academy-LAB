import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopMenu from "./top-menu/TopMenu.jsx";
import Banner from "./components/Banner.jsx";
import TalkTrack from "./components/TalkTrack.jsx";
import ShelfLink from "./components/ShelfLink.jsx";
import ReleaseNotes from "./components/ReleaseNotes.jsx";
import VerifyMark from "./components/VerifyMark.jsx";
import PatternDiagram from "./components/PatternDiagram.jsx";
import { getJson, setMode } from "./api";
import { workspaceId } from "./workspace";

const STAGE_ORDER = ["discover", "register", "authenticate", "authorize", "govern"];
const STAGE_LABELS = Object.fromEntries(STAGE_ORDER.map((s) => [s, s[0].toUpperCase() + s.slice(1)]));

// Escaped text for anything rendered through dangerouslySetInnerHTML-free paths; the app renders
// all API data as React text, so this guards only the small hand-built evidence snippets.
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function frameDetail(frame) {
  return frame.length > 4 && frame[4] && typeof frame[4] === "object" ? frame[4] : null;
}

// Every claim of both tokens, with only the ones that moved marked.
function claimDiffRows(before, after) {
  if (!before && !after) return null;
  const keys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])];
  return keys.map((key) => {
    const b = before?.[key];
    const a = after?.[key];
    const change = b === undefined ? "added" : a === undefined ? "removed" : b !== a ? "changed" : "same";
    return { key, b, a, change };
  });
}

export default function App() {
  const [lessonId, setLessonId] = useState(null);
  const [story, setStory] = useState(null);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [present, setPresent] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [theme, setTheme] = useState(() => (localStorage.getItem("theme") || "auto"));

  // The reel: one playhead per the whole app, advanced by Run, paused, or clicked.
  const [frameIdx, setFrameIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [runStarted, setRunStarted] = useState(() => new Set());

  useEffect(() => {
    document.documentElement.dataset.theme = theme === "auto" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadAll = useCallback(async () => {
    try {
      const [s, i] = await Promise.all([
        fetch("/api/story").then((r) => r.json()),
        fetch("/api/info").then((r) => r.json()),
      ]);
      setStory(s); setInfo(i);
      setLessonId((cur) => (cur && s.lessons.some((l) => l.id === cur) ? cur : s.lessons[0].id));
      setError(null);
    } catch (e) {
      setError(String(e.message || e));
    }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  // Playback: one frame every 2.2 s, stopping on the last frame. A manual click takes over.
  useEffect(() => {
    if (!running || !story) return undefined;
    const lesson = story.lessons.find((l) => l.id === lessonId);
    if (!lesson) return undefined;
    const t = setInterval(() => {
      setFrameIdx((cur) => {
        if (cur >= lesson.frames.length - 1) { setRunning(false); return cur; }
        return cur + 1;
      });
    }, 2200);
    return () => clearInterval(t);
  }, [running, story, lessonId]);

  const reset = async () => {
    await fetch("/api/reset", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    setResetSignal((n) => n + 1);
    setRunning(false);
    setFrameIdx(-1);
    setRunStarted(new Set());
    await loadAll();
  };

  const changeMode = async (source) => {
    const r = await fetch("/api/mode", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ source }) });
    if (r.ok) setInfo((i) => ({ ...i, mode: source, source }));
    return r.ok;
  };

  const lesson = story?.lessons.find((l) => l.id === lessonId) ?? null;

  const selectLesson = (id) => {
    setLessonId(id);
    setRunning(false);
    setFrameIdx(-1);
  };

  const runLesson = () => {
    if (!lesson) return;
    setRunStarted((s) => new Set(s).add(lesson.id));
    setFrameIdx((cur) => (cur >= lesson.frames.length - 1 ? 0 : cur < 0 ? 0 : cur));
    setRunning((r) => !r);
  };

  const pickFrame = (i) => {
    setRunning(false);
    setFrameIdx(i);
  };

  if (error && !story) return <p className="app-error">The lab could not start: {error}</p>;
  if (!story || !lesson) return <p className="muted">Loading…</p>;

  const lessonIndex = story.lessons.findIndex((l) => l.id === lesson.id);
  const activeStages = new Set([...lesson.stages, ...lesson.frames.map((f) => f[0])]);
  const tracking = runStarted.has(lesson.id) && frameIdx >= 0;
  const frame = frameIdx >= 0 ? lesson.frames[frameIdx] : null;
  const detail = frame ? frameDetail(frame) : null;
  const diff = detail ? claimDiffRows(detail.before, detail.after) : null;
  const isLast = frameIdx === lesson.frames.length - 1;

  return (
    <div className={present ? "app app--presenter" : "app"}>
      <header className="shell-bar">
        <span className="shell-brand">
          <span className="shell-logo">AI</span>
          Agent Identity Academy
          <span className={`shell-badge ${info?.mode === "real" ? "shell-badge--real" : ""}`} data-testid="mode-badge">{info?.mode ?? "…"}</span>
        </span>
        <nav className="shell-nav" aria-label="Tabs">
          <a href="#lessons" aria-current="page" onClick={(e) => e.preventDefault()}>Lessons</a>
          <a href="#journey" onClick={(e) => { e.preventDefault(); document.getElementById("journey")?.scrollIntoView(); }}>Journey</a>
        </nav>
        <TopMenu
          mode={{ value: info?.mode ?? "mock", onChange: changeMode, realAvailable: info?.realAvailable, realHint: info?.realHint }}
          theme={{ value: theme, onChange: setTheme }}
          present={{ active: present, onToggle: () => setPresent((p) => !p) }}
          talkTrack={{ active: talkOpen, onToggle: () => setTalkOpen((t) => !t) }}
          onReset={reset}
          version={info?.version ? `v${info.version}` : undefined}
          onVersion={() => setNotesOpen(true)}
        >
          <ShelfLink />
          <VerifyMark id="agent-identity-academy" />
        </TopMenu>
        {notesOpen && <ReleaseNotes version={info?.version ? `v${info.version}` : ""} onClose={() => setNotesOpen(false)} />}
      </header>
      <main className="page">
        <Banner story={story} mode={info?.mode} />
        <p className="keys">Workspace {workspaceId()} · everything simulated · no tenant, no outbound network</p>

        <section className="maturity-rail" aria-label="Agent identity lifecycle" data-testid="stage-rail">
          {story.stages.map((s) => (
            <div key={s.id} className={`maturity-stage${activeStages.has(s.id) ? " maturity-stage--on" : ""}`} data-stage={s.id} data-state={activeStages.has(s.id) ? "active" : "idle"}>
              <strong>{s.label}</strong>
              <span>{s.question}</span>
            </div>
          ))}
        </section>

        <div className="aca-grid">
          <aside className="aca-rail" aria-label="Academy lessons">
            <p className="aca-rail__intro">Customer journey · {story.lessons.length} lessons</p>
            <nav className="aca-lesson-list" data-testid="lesson-list">
              {story.lessons.map((l, i) => (
                <button key={l.id} type="button" className={`aca-lesson${l.id === lesson.id ? " aca-lesson--on" : ""}`} data-testid={`lesson-${l.id}`} aria-current={l.id === lesson.id ? "page" : "false"} onClick={() => selectLesson(l.id)}>
                  <span className="aca-lesson__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="aca-lesson__label"><strong>{l.nav}</strong><small>{l.taxonomy}</small></span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="aca-main" data-testid={`lesson-${lesson.id}`}>
            <div className="panel aca-hero">
              <p className="section-label">{lesson.category} · {lesson.taxonomy}</p>
              <h1><span className="step-num" aria-hidden="true">{String(lessonIndex + 1).padStart(2, "0")}</span>{lesson.title}</h1>
              <p className="intro">{lesson.description}</p>
              <p className="aca-outcome"><strong>Outcome: </strong>{lesson.outcome}</p>
            </div>

            <div className="duo">
              <div className="card" data-testid="trust-path">
                <h3>The actors and the trust boundary</h3>
                <p className="aca-request"><strong>Request: </strong>{lesson.request}</p>
                <ol className="aca-actors">
                  {lesson.actors.map(([role, name, does], i) => (
                    <li key={i} className="aca-actor">
                      <span className="aca-actor__role">{role}</span>
                      <strong>{name}</strong>
                      <small>{does}</small>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="card" data-testid="run-panel">
                <h3>Run the lesson</h3>
                <p className="aca-scenario"><strong>{lesson.scenario}</strong><br />{lesson.scenarioCopy}</p>
                <p className="run-state" data-testid="run-status" aria-live="polite">
                  {!tracking ? "Ready. Run the mock to reveal each control point." : isLast ? "Mock complete · final frame." : `Running · frame ${frameIdx + 1} of ${lesson.frames.length}.`}
                </p>
                <div className="aca-run-actions">
                  <button type="button" className="btn btn--primary" data-testid="run-action" onClick={runLesson}>{running ? "Pause" : frameIdx >= 0 ? "Replay" : "Run mock"}</button>
                  <button type="button" className="btn" data-testid="frame-prev" disabled={frameIdx <= 0} onClick={() => pickFrame(frameIdx - 1)}>‹ Prev</button>
                  <button type="button" className="btn" data-testid="frame-next" disabled={frameIdx < 0 || isLast} onClick={() => pickFrame(frameIdx + 1)}>Next ›</button>
                  <span className="aca-frame-count" data-testid="frame-counter">{frameIdx < 0 ? 0 : frameIdx + 1} / {lesson.frames.length}</span>
                </div>
                <p className="aca-presenter"><strong>Presenter close: </strong>{lesson.presenter}</p>
              </div>
            </div>

            <div className="panel" data-testid="filmstrip-panel">
              <h2>Agent movie reel</h2>
              <p className="keys">One action, every identity decision in sequence. Select a frame to inspect its evidence.</p>
              <div className="aca-filmstrip" data-testid="filmstrip">
                {lesson.frames.map((f, i) => {
                  const d = frameDetail(f);
                  const state = !tracking ? "" : i < frameIdx ? "done" : i === frameIdx ? "active" : "pending";
                  return (
                    <button key={i} type="button" className={`aca-frame aca-frame--${f[0]}${frameIdx === i ? " aca-frame--sel" : ""}`} data-testid={`frame-${i}`} data-stage={f[0]} data-state={state} aria-pressed={frameIdx === i} onClick={() => pickFrame(i)}>
                      <span>{String(i + 1).padStart(2, "0")} · {STAGE_LABELS[f[0]] ?? f[0]}</span>
                      <strong>{f[1]}</strong>
                      <small>{f[2]}</small>
                      {d?.fact && <em className={`aca-fact aca-fact--${d.fc ?? "ok"}`}>{state === "pending" ? "waiting" : d.fact}</em>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={`panel aca-evidence${detail ? " aca-evidence--detail" : ""}`} data-testid="evidence" aria-live="polite">
              <span className="aca-source">MOCK · sample claims</span>
              {!frame && (
                <>
                  <h3>Evidence appears here</h3>
                  <p>Run the lesson, then select a frame to inspect the mock proof.</p>
                  <pre className="aca-code">No run started.</pre>
                </>
              )}
              {frame && !detail && (
                <>
                  <h3>{frame[1]}</h3>
                  <p>{frame[2]}</p>
                  <pre className="aca-code">{frame[3]}</pre>
                </>
              )}
              {frame && detail && (
                <div className="aca-evidence-grid">
                  <div>
                    <h3>{frame[1]}</h3>
                    <p className="aca-evidence-what">{frame[2]}</p>
                    {detail.tokens?.length > 0 && (
                      <>
                        <p className="aca-sheet-label">Tokens in play</p>
                        <div className="aca-tokens">{detail.tokens.map((t, i) => <span key={i} className="aca-token">{esc(t)}</span>)}</div>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="aca-sheet-label">What changed</p>
                    {diff ? (
                      <table className="aca-diff" data-testid="claim-diff">
                        <thead><tr><th>Claim</th><th>Before</th><th>After</th></tr></thead>
                        <tbody>
                          {diff.map((r) => (
                            <tr key={r.key} data-change={r.change}>
                              <td>{esc(r.key)}</td>
                              <td>{r.b === undefined ? "—" : esc(String(r.b))}</td>
                              <td>{r.a === undefined ? "—" : esc(String(r.a))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="keys">No token at this step.</p>}
                    <p className="aca-sheet-label">Request and response</p>
                    <div className="aca-io">
                      <pre className="aca-code">{detail.req}</pre>
                      <pre className="aca-code">{detail.res}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="panel" data-testid="product-map">
              <h2>Evidence to product map</h2>
              <p className="keys">This lesson crosses {lesson.stages.map((s) => STAGE_LABELS[s]).join(", ")}. Each frame names the product or standard responsible for the control.</p>
              <div className="aca-chips" data-testid="product-chips">{lesson.products.map((p, i) => <span key={i} className="aca-chip">{p}</span>)}</div>
              <ol className="aca-frame-map" data-testid="frame-product-map">
                {lesson.frames.map((f, i) => (
                  <li key={i}>
                    <span>{String(i + 1).padStart(2, "0")} · {f[1]}</span>
                    <span aria-hidden="true">→</span>
                    <strong>{lesson.frameProducts[i] ?? lesson.frameProducts[lesson.frameProducts.length - 1]}</strong>
                  </li>
                ))}
              </ol>
            </div>

            <LessonDiagram name={lesson.diagram} resetSignal={resetSignal} />
          </section>
        </div>

        {talkOpen && (
          <div className="panel"><h2>Talk track</h2><TalkTrack talk={story.talkTrack.map((t, i) => ({ ...t, id: i }))} /></div>
        )}
      </main>
    </div>
  );
}

function LessonDiagram({ name, resetSignal }) {
  const [pattern, setPattern] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { setPattern(null); setErr(null); getJson(`/api/diagram?name=${encodeURIComponent(name)}`).then(setPattern, (e) => setErr(e.message)); }, [name]);
  if (err) return <p className="field-error" role="alert">Could not load the diagram ({err}).</p>;
  if (!pattern) return <p className="muted">Loading diagram…</p>;
  return <PatternDiagram pattern={pattern} resetSignal={resetSignal} />;
}
