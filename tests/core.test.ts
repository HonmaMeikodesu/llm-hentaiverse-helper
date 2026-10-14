import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import { IDBFactory } from "fake-indexeddb";
import { observe, literals } from "../src/automation/observe.js";
import { Journal } from "../src/automation/journal.js";
import { BattleEngine, EnginePorts } from "../src/automation/engine.js";
import { Session, Snapshot, TraceEvent, uid } from "../src/automation/types.js";
import {
  decisionRequest,
  demonstrationPairs,
  paidJSON,
  parseDecision,
  parsePreferences,
  summaryRequest,
} from "../src/automation/decision.js";
import { BRIDGE, readAction } from "../src/automation/protocol.js";
import { jevConnection } from "../src/automation/providers.js";

const fixture = (name = "startBattle") =>
  parseHTML(readFileSync(`docs/research/${name}.html`, "utf8"))
    .document as unknown as Document;
const sample = () => observe(fixture());
test("historical snapshots bind targets, retain disabled slots and do not export session secrets", () => {
  for (const name of ["startBattle", "nextTurnBattle", "battle1"]) {
    const s = observe(fixture(name));
    assert.equal(s.stage, "battle");
    assert.deepEqual(s.issues, []);
    assert.equal(
      new Set(s.candidates.map((c) => c.id)).size,
      s.candidates.length,
    );
    assert(
      s.candidates.some((c) => c.name === "Cure" && c.action.target === 0),
    );
    assert.equal(
      s.candidates.filter((c) => c.action.mode === "attack").length,
      s.monsters.filter((m) => m.targetable).length,
    );
    for (const c of s.candidates.filter((c) => c.targetId))
      assert(s.monsters.some((m) => m.id === c.targetId && m.targetable));
    assert(!JSON.stringify(s).includes("battle_token"));
  }
  const before = sample(),
    after = observe(fixture("nextTurnBattle"));
  assert.equal(before.player.hp, 6107);
  assert.equal(before.round, 1);
  assert.equal(before.totalRounds, 12);
  assert.equal(
    before.candidates.some((c) => c.name === "Shield Bash"),
    false,
  );
  assert(after.items.some((i) => i.name === "Health Draught" && !i.available));
  assert(!after.candidates.some((c) => c.controlId === "ikey_1"));
});
test("effects belong only to the monster that displays them; visual animation is not a state transition", () => {
  const doc = fixture();
  const effect = doc.createElement("img");
  effect.setAttribute(
    "onmouseover",
    "battle.set_infopane_effect('Weaken','Less damage',3)",
  );
  doc.querySelector("#mkey_2 .btm6")!.append(effect);
  const s = observe(doc);
  assert.equal(s.monsters[0].effects.length, 0);
  assert.equal(s.monsters[1].effects[0].name, "Weaken");
  effect.style.opacity = ".5";
  assert.equal(observe(doc).revision, s.revision);
  assert.deepEqual(literals("f('Bob\\'s skill', 'text', 'a', 4, 1, 2)"), [
    "Bob's skill",
    "text",
    "a",
    4,
    1,
    2,
  ]);
});
test("unknown vitals and oversized choice sets stop decisions; terminal pages have no combat candidates", () => {
  const doc = fixture();
  doc.getElementById("vrm")!.remove();
  const s = observe(doc);
  assert.equal(s.player.mp, null);
  assert(s.issues.length);
  assert.throws(() =>
    decisionRequest(s, {
      profile: { id: "p", name: "p", configuration: "fixed" },
      preferences: null,
    }),
  );
  const terminal = fixture();
  terminal.getElementById("pane_monster")!.textContent =
    "You have been defeated";
  assert.equal(observe(terminal).stage, "ended");
  assert.equal(observe(terminal).candidates.length, 0);
  const large = sample();
  large.candidates = Array.from({ length: 256 }, (_, i) => ({
    ...large.candidates[0],
    id: `a${i}`,
  }));
  assert.throws(() =>
    decisionRequest(large, {
      profile: { id: "p", name: "p", configuration: "fixed" },
      preferences: null,
    }),
  );
});
test("round context survives log trimming but an unrecognized completion is not assumed safe to continue", () => {
  const doc = fixture();
  const before = observe(doc);
  doc.querySelector("#textlog")!.textContent = "Later battle log";
  doc.getElementById("pane_monster")!.textContent = "You are victorious";
  doc.getElementById("pane_completion")!.innerHTML =
    '<button id="btcp" onclick="battle.battle_continue()">Continue</button>';
  assert.equal(observe(doc).stage, "unknown");
  assert.equal(observe(doc, before).stage, "round-end");
});
test("protocol sanitizes action fields and never retains tokens", () => {
  assert.deepEqual(
    readAction({
      type: "battle",
      method: "action",
      mode: "items",
      target: 0,
      skill: "ikey_1",
      token: "secret",
    }),
    { mode: "items", target: 0, skill: "1" },
  );
  assert.equal(
    readAction({
      type: "battle",
      method: "action",
      mode: "attack",
      target: "oops",
    }),
    null,
  );
});
test("journal writes an ordered event stream atomically and survives reopen; stale pages cannot append", async () => {
  const factory = new IDBFactory(),
    name = uid();
  const journal = new Journal(factory, name);
  const s = await journal.create(
    1,
    "page-a",
    "record",
    sample(),
    { id: "profile", name: "test", configuration: "fixed" },
    null,
  );
  await Promise.all(
    Array.from({ length: 12 }, (_, i) =>
      journal.append(s.id, "page-a", "observation", { i }),
    ),
  );
  const reopened = new Journal(factory, name);
  const events = await reopened.events(s.id);
  assert.deepEqual(
    events.map((e) => e.seq),
    Array.from({ length: 13 }, (_, i) => i + 1),
  );
  await journal.append(
    s.id,
    "page-a",
    "intent",
    { id: "pending" },
    { pending: "pending" },
  );
  const attached = await reopened.attach(1, "page-b", sample());
  assert.equal(attached?.mode, "paused");
  assert.equal(attached?.pending, "pending");
  await assert.rejects(
    journal.append(s.id, "page-a", "result", {}),
    /replaced/,
  );
  await journal.set("settings", { jevKey: "private-key" });
  assert(!JSON.stringify(await journal.export()).includes("private-key"));
});
test("only an explicitly recorded round advance resumes across pages; concurrent game tabs are refused", async () => {
  const journal = new Journal(new IDBFactory());
  const s = await journal.create(
    1,
    "a",
    "record",
    sample(),
    { id: "p", name: "p", configuration: "fixed" },
    null,
  );
  await assert.rejects(
    journal.create(2, "b", "record", sample(), s.profile, null),
    /另一个标签页/,
  );
  await journal.append(
    s.id,
    "a",
    "round-advance-intent",
    {},
    { advanceFrom: 1 },
  );
  const next = { ...sample(), round: 2 };
  const resumed = await journal.attach(1, "b", next);
  assert.equal(resumed?.mode, "record");
  assert.equal(resumed?.advanceFrom, null);
  const unsolicited = await journal.attach(1, "c", { ...next, round: 3 });
  assert.equal(unsolicited?.mode, "paused");
});
function harness(overrides: Partial<EnginePorts> = {}) {
  let snapshot = sample();
  let session: Session = {
    id: "s",
    tabId: 1,
    pageId: "page",
    at: "",
    updatedAt: "",
    mode: "auto",
    seq: 0,
    profile: { id: "p", name: "p", configuration: "fixed" },
    preferences: null,
    pending: null,
    advanceFrom: null,
    last: snapshot,
    reason: null,
  };
  const events: { kind: string; data: any }[] = [],
    clicks: string[] = [],
    errors: string[] = [];
  const ports: EnginePorts = {
    observe: () => snapshot,
    append: async (kind, data, patch) => {
      events.push({ kind, data });
      session = { ...session, ...patch, seq: session.seq + 1 };
      return session;
    },
    decide: async (s) => ({
      candidateId: s.candidates[0].id,
      model: "fake",
      confidence: 1,
      probabilities: {},
      usageId: "u",
    }),
    execute: (c) => {
      clicks.push(c.id);
    },
    advance: () => {
      clicks.push("next-round");
    },
    changed: (_, error) => {
      if (error) errors.push(error);
    },
    ...overrides,
  };
  const engine = new BattleEngine(ports);
  engine.install(session);
  return {
    engine,
    events,
    clicks,
    errors,
    setSnapshot: (s: Snapshot) => (snapshot = s),
    snapshot: () => snapshot,
  };
}
test("no click before durable intent, no second click while action is pending; result confirms then unlocks", async () => {
  const h = harness();
  await h.engine.tick();
  assert.equal(h.clicks.length, 1);
  assert.equal(h.events.at(-1)?.kind, "intent");
  await h.engine.tick();
  assert.equal(h.clicks.length, 1);
  await h.engine.receive({
    channel: BRIDGE,
    kind: "request",
    requestId: "r",
    action: h.snapshot().candidates[0].action,
  });
  assert.equal(h.events.at(-1)?.data.source, "jev");
  h.setSnapshot(observe(fixture("nextTurnBattle")));
  await h.engine.receive({
    channel: BRIDGE,
    kind: "response",
    requestId: "r",
    ok: true,
    status: 200,
  });
  assert.equal(h.engine.session?.pending, null);
  assert.equal(h.events.at(-1)?.kind, "result");
  await h.engine.end();
});
test("storage failure blocks execution and does not call the model", async () => {
  let calls = 0;
  const h = harness({
    append: async () => {
      throw new Error("Disk full");
    },
    decide: async () => {
      calls++;
      throw new Error("unexpected");
    },
  });
  await h.engine.tick();
  await h.engine.tick();
  assert.equal(h.clicks.length, 0);
  assert.equal(calls, 0);
  assert(h.errors.includes("Disk full"));
  assert(!h.engine.isRunning);
});
test("late decisions after manual pause or a changed state cannot execute", async () => {
  for (const reason of ["pause", "change"]) {
    let resolve!: (value: any) => void;
    let called!: () => void;
    const started = new Promise<void>((r) => (called = r));
    const h = harness({
      decide: async () => {
        called();
        return new Promise((r) => (resolve = r));
      },
    });
    const work = h.engine.tick();
    await started;
    if (reason === "pause") await h.engine.pause("manual");
    else h.setSnapshot(observe(fixture("nextTurnBattle")));
    resolve({
      candidateId: sample().candidates[0].id,
      model: "fake",
      probabilities: {},
      usageId: "u",
    });
    await work;
    assert.equal(h.clicks.length, 0);
    assert.equal(h.engine.session?.mode, "paused");
  }
});
test("unknown game responses retain unresolved intent and stop automatic actions", async () => {
  const h = harness();
  await h.engine.tick();
  await h.engine.receive({
    channel: BRIDGE,
    kind: "request",
    requestId: "r",
    action: h.snapshot().candidates[0].action,
  });
  await h.engine.receive({
    channel: BRIDGE,
    kind: "response",
    requestId: "r",
    ok: false,
    status: 500,
  });
  await h.engine.tick();
  assert.equal(h.clicks.length, 1);
  assert.equal(h.engine.session?.pending, "r");
  assert.equal(h.engine.session?.mode, "paused");
  await h.engine.end();
});
test("model responses cannot inject an action; unverified probabilities are not game win chances", () => {
  assert.throws(() =>
    parseDecision(
      { answers: { action: { type: "choice", choice: "eval(alert(1))" } } },
      sample(),
      "u",
    ),
  );
  const s = sample();
  assert.equal(
    parseDecision(
      {
        answers: {
          action: { type: "choice", choice: s.candidates[0].id, confidence: 5 },
        },
      },
      s,
      "u",
    ).confidence,
    null,
  );
});
test("human demonstrations exclude AI actions, failed outcomes and gaps; citations must exist", () => {
  const s = sample();
  const make = (kind: string, data: any, i: number): TraceEvent => ({
    id: `s:${i}`,
    sessionId: "s",
    seq: i,
    at: "",
    kind,
    data,
  });
  const request = (source: string, requestId: string) => ({
    source,
    requestId,
    before: s,
    candidateId: s.candidates[0].id,
    action: s.candidates[0].action,
  });
  const events = [
    make("request", request("human", "r1"), 1),
    make("result", { requestId: "r1", ok: true, after: s }, 2),
    make("request", request("jev", "r2"), 3),
    make("result", { requestId: "r2", ok: true, after: s }, 4),
    make("request", request("human", "r3"), 5),
    make("gap", {}, 6),
    make("result", { requestId: "r3", ok: true, after: s }, 7),
  ];
  assert.equal(demonstrationPairs(events).length, 1);
  const p = {
    preferences: [
      {
        condition: "near end",
        preference: "attack",
        evidence: ["missing"],
        counterEvidence: [],
      },
    ],
  };
  assert.throws(() =>
    parsePreferences(JSON.stringify(p), new Set(["s:1"]), ["s"]),
  );
  p.preferences[0].evidence = ["s:1"];
  assert.equal(
    parsePreferences(JSON.stringify(p), new Set(["s:1"]), ["s"]).preferences[0]
      .status,
    "proposed",
  );
});
test("usage is written before requests, malformed responses are accounted, and $5 is not a call limit", async () => {
  const usages: any[] = [];
  let calls = 0;
  const fake = async () => {
    calls++;
    assert.equal(usages.at(-1).status, "pending");
    return new Response(
      JSON.stringify({
        model: "fake",
        usage: { input_tokens: 200_000_000, output_tokens: 0 },
      }),
      { status: 200 },
    );
  };
  for (let i = 0; i < 2; i++)
    await paidJSON(
      "https://example.invalid",
      "secret",
      { model: "fake" },
      "decision",
      [0.042, 0],
      async (u) => {
        usages.push(u);
      },
      fake as any,
    );
  assert.equal(calls, 2);
  assert.equal(usages.at(-1).usd, 8.4);
  await assert.rejects(
    paidJSON(
      "https://example.invalid",
      "secret",
      {},
      "decision",
      [0.042, 0],
      async () => {
        throw new Error("Disk full");
      },
      fake as any,
    ),
  );
  assert.equal(calls, 2);
  await assert.rejects(
    paidJSON(
      "https://example.invalid",
      "secret",
      {},
      "decision",
      [0.042, 0],
      async (u) => {
        usages.push(u);
      },
      (async () => new Response("not JSON")) as any,
    ),
    /JSON/,
  );
  assert.equal(usages.at(-1).status, "unknown");
  assert.equal(usages.at(-1).usd, null);
});
test("summary requests are bounded, cover the full batch and retain evidence identifiers", () => {
  const s = sample();
  const pairs = Array.from({ length: 1000 }, (_, i) => ({
    evidence: `s:${i}`,
    before: s,
    after: s,
    candidateId: s.candidates[0].id,
    action: s.candidates[0].action,
  }));
  const request = summaryRequest(pairs, "fixed", "fake");
  assert(request.messages[1].content.length <= 80000);
  const data = JSON.parse(request.messages[1].content);
  assert.equal(data.totalCompleteHumanActions, 1000);
  assert.equal(data.examples[0].evidence, "s:0");
  assert.equal(data.examples.at(-1).evidence, "s:999");
});

test("Vercel routes native Jev requests and preserves reported cost without borrowing direct-provider prices", async () => {
  const connection = jevConnection({
    jevProvider: "vercel",
    jevModel: "typesafe-ai/jev",
  });
  assert.equal(
    connection.endpoint,
    "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
  );
  assert.deepEqual(connection.prices, [null, null]);
  assert.deepEqual(
    jevConnection({ jevProvider: "typesafe", jevModel: "jev-1.13.0" }).prices,
    [0.042, 0],
  );
  const usages: any[] = [];
  for (const cost of ["0.00001155", "", null, -1]) {
    await paidJSON(
      connection.endpoint,
      "test-key",
      { model: "typesafe-ai/jev" },
      "decision",
      connection.prices,
      async (u) => {
        usages.push(u);
      },
      (async (url, init) => {
        assert.equal(url, connection.endpoint);
        assert.equal(JSON.parse(String(init?.body)).model, "typesafe-ai/jev");
        return new Response(
          JSON.stringify({
            model: "typesafe-ai/jev",
            usage: { input_tokens: 275, output_tokens: 20 },
            provider_metadata: { gateway: { cost } },
          }),
        );
      }) as typeof fetch,
    );
    assert.equal(usages.at(-1).usd, cost === "0.00001155" ? 0.00001155 : null);
    assert.equal(
      usages.at(-1).costSource,
      cost === "0.00001155" ? "provider" : "unknown",
    );
    assert.equal(usages.at(-1).endpoint, connection.endpoint);
  }
});
