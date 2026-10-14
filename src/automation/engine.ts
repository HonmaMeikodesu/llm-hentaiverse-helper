import {
  Action,
  Candidate,
  Decision,
  Session,
  Snapshot,
  actionKey,
  uid,
} from "./types.js";
import { BridgeMessage } from "./protocol.js";

export type EnginePorts = {
  observe(): Snapshot;
  append(
    kind: string,
    data: unknown,
    patch?: Partial<Session>,
  ): Promise<Session>;
  decide(snapshot: Snapshot): Promise<Decision>;
  execute(candidate: Candidate): void;
  advance(): void;
  changed(session: Session | null, error: string | null): void;
};
export class BattleEngine {
  session: Session | null = null;
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private deciding = false;
  private expected: {
    id: string;
    candidate: Candidate;
    before: Snapshot;
  } | null = null;
  private requests = new Map<
    string,
    { before: Snapshot; source: "human" | "jev"; action: Action }
  >();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private broken = false;
  private attachedPending: string | null = null;
  constructor(private ports: EnginePorts) {}
  get isRunning() {
    return this.session?.mode === "auto" && !this.broken;
  }
  async continueRecordedRound() {
    return this.serial(async () => {
      if (
        this.broken ||
        this.session?.mode !== "record" ||
        this.session.pending ||
        this.session.advanceFrom !== null
      )
        return;
      const snapshot = this.ports.observe();
      if (snapshot.stage !== "round-end") return;
      await this.save(
        "round-advance-intent",
        { snapshot },
        { last: snapshot, advanceFrom: snapshot.round },
      );
      this.ports.advance();
      this.armTimeout("Next round did not load");
    });
  }
  install(session: Session | null) {
    this.generation++;
    this.session = session;
    this.attachedPending = session?.pending || null;
    this.broken = false;
    this.ports.changed(session, null);
  }
  private serial<T>(fn: () => Promise<T>): Promise<T | undefined> {
    const next = this.queue.then(fn);
    this.queue = next.catch((error) => {
      this.broken = true;
      this.generation++;
      this.ports.changed(
        this.session,
        error instanceof Error ? error.message : "Recording failed",
      );
    });
    return next.catch(() => undefined);
  }
  private async save(
    kind: string,
    data: unknown,
    patch: Partial<Session> = {},
  ) {
    this.session = await this.ports.append(kind, data, patch);
    this.ports.changed(this.session, null);
  }
  async pause(reason: string) {
    this.generation++;
    clearTimeout(this.timer);
    return this.serial(async () => {
      if (this.session && this.session.mode !== "ended")
        await this.save("pause", { reason }, { mode: "paused", reason });
    });
  }
  async resume(mode: "record" | "auto") {
    this.generation++;
    return this.serial(async () => {
      if (!this.session || this.session.mode === "ended") return;
      if (this.session.pending && this.session.pending !== this.attachedPending)
        throw new Error(
          "上次动作结果仍不明确，请先刷新游戏页面核对状态，再恢复",
        );
      if (this.requests.size)
        throw new Error("游戏请求尚未结束，请等待或刷新后再恢复");
      const snapshot = this.ports.observe();
      if (!["battle", "round-end"].includes(snapshot.stage))
        throw new Error("Current page cannot resume a battle");
      // Resumption never replays an unresolved intent. Keep it explicitly unresolved in history.
      await this.save(
        "resume",
        { snapshot, unresolvedAction: this.session.pending, mode },
        {
          mode,
          pending: null,
          last: snapshot,
          advanceFrom: null,
          reason: null,
        },
      );
      this.requests.clear();
      this.expected = null;
      this.broken = false;
    });
  }
  async end() {
    this.generation++;
    clearTimeout(this.timer);
    return this.serial(async () => {
      if (this.session && this.session.mode !== "ended")
        await this.save(
          "end",
          {
            snapshot: this.ports.observe(),
            unresolvedAction: this.session.pending,
          },
          { mode: "ended", reason: "Ended by user" },
        );
    });
  }
  receive(message: BridgeMessage) {
    if (!this.session || this.session.mode === "ended" || this.broken) return;
    const snapshot = this.ports.observe(); // Capture at arrival, before an asynchronous storage queue.
    if (message.kind === "request" && message.action) {
      const action = message.action;
      const expected =
        this.expected &&
        actionKey(this.expected.candidate.action) === actionKey(action)
          ? this.expected
          : null;
      const source = expected ? ("jev" as const) : ("human" as const);
      const before = expected?.before || snapshot;
      const candidate = before.candidates.find(
        (c) => actionKey(c.action) === actionKey(action),
      );
      this.expected = null;
      return this.serial(async () => {
        if (this.requests.size)
          await this.save(
            "gap",
            { reason: "Overlapping requests; attribution is uncertain" },
            { mode: "paused", reason: "Overlapping actions" },
          );
        this.requests.set(message.requestId, { before, source, action });
        await this.save(
          "request",
          {
            requestId: message.requestId,
            action,
            candidateId: candidate?.id || null,
            source,
            before,
            intentId: expected?.id || null,
          },
          {
            pending: message.requestId,
            ...(source === "human" && this.session?.mode === "auto"
              ? {
                  mode: "paused" as const,
                  reason: "Manual action during takeover",
                }
              : {}),
          },
        );
        this.armTimeout("No confirmed game response");
      });
    }
    if (message.kind === "response")
      return this.serial(async () => {
        clearTimeout(this.timer);
        const request = this.requests.get(message.requestId);
        this.requests.delete(message.requestId);
        if (!request) {
          await this.save(
            "gap",
            {
              reason: "Response without a recorded request",
              requestId: message.requestId,
              snapshot,
            },
            {
              mode: "paused",
              reason: "Missing action provenance",
              last: snapshot,
            },
          );
          return;
        }
        // Protocol evidence and a coherent post-state are both required. No DOM change alone confirms an action.
        const ok =
          message.ok === true &&
          !["outside", "unknown"].includes(snapshot.stage) &&
          !snapshot.issues.length;
        await this.save(
          "result",
          {
            requestId: message.requestId,
            ok,
            source: request.source,
            httpStatus: message.status,
            reason: message.reason,
            after: snapshot,
          },
          {
            last: snapshot,
            pending: ok ? null : message.requestId,
            ...(ok
              ? {}
              : {
                  mode: "paused" as const,
                  reason: "Action result unconfirmed",
                }),
          },
        );
        if (snapshot.stage === "ended" && ok)
          await this.save(
            "battle-ended",
            { snapshot },
            { mode: "ended", reason: snapshot.completion },
          );
        if (
          ok &&
          this.session?.purpose === "diagnostic" &&
          (this.session.confirmedActions || 0) >= 5 &&
          this.session.mode !== "ended"
        )
          await this.save(
            "pause",
            { reason: "无偏好测试已完成 5 个确认动作" },
            {
              mode: "paused",
              reason: "无偏好测试已完成 5 个确认动作，请结束测试记录",
            },
          );
        if (snapshot.stage === "challenge")
          await this.save(
            "pause",
            { reason: "Manual game challenge" },
            { mode: "paused", reason: "Game requires manual input" },
          );
      });
  }
  private armTimeout(reason: string) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.pause(reason), 15000);
  }
  async tick() {
    if (
      this.deciding ||
      this.broken ||
      this.session?.mode !== "auto" ||
      this.session.pending ||
      this.session.advanceFrom !== null ||
      this.expected
    )
      return;
    this.deciding = true;
    const generation = this.generation;
    try {
      await this.queue;
      if (
        this.broken ||
        generation !== this.generation ||
        this.session?.mode !== "auto"
      )
        return;
      const snapshot = this.ports.observe();
      if (snapshot.revision !== this.session.last.revision) {
        await this.pause("Unattributed state change; inspect before resuming");
        return;
      }
      if (
        this.session.purpose === "diagnostic" &&
        (this.session.confirmedActions || 0) >= 5
      ) {
        await this.pause("无偏好测试已完成 5 个确认动作，请结束测试记录");
        return;
      }
      if (snapshot.stage === "round-end") {
        await this.serial(async () => {
          await this.save(
            "round-advance-intent",
            { snapshot },
            { advanceFrom: snapshot.round },
          );
          if (
            generation === this.generation &&
            !this.broken &&
            this.session?.mode === "auto"
          )
            this.ports.advance();
        });
        // If navigation never happens, do not repeatedly press Continue.
        this.armTimeout("Next round did not load; inspect before resuming");
        return;
      }
      if (snapshot.stage !== "battle" || snapshot.issues.length) {
        await this.pause(
          snapshot.issues.join("; ") || "Page requires manual input",
        );
        return;
      }
      await this.serial(() =>
        this.save("decision-start", {
          revision: snapshot.revision,
          preferenceVersion: this.session?.preferences?.id || null,
        }),
      );
      if (this.broken || generation !== this.generation) return;
      const decision = await this.ports.decide(snapshot);
      if (
        generation !== this.generation ||
        this.session?.mode !== "auto" ||
        this.broken
      )
        return;
      const candidate = snapshot.candidates.find(
        (c) => c.id === decision.candidateId,
      );
      if (!candidate)
        throw new Error("Decision did not select a current candidate");
      await this.serial(async () => {
        await this.save("decision", {
          revision: snapshot.revision,
          ...decision,
        });
        if (
          generation !== this.generation ||
          this.ports.observe().revision !== snapshot.revision
        ) {
          await this.save(
            "pause",
            { reason: "Stale decision discarded" },
            { mode: "paused", reason: "State changed during decision" },
          );
          return;
        }
        const id = uid();
        await this.save(
          "intent",
          { id, candidate, before: snapshot, source: "jev" },
          { pending: id },
        );
        if (
          generation !== this.generation ||
          this.ports.observe().revision !== snapshot.revision
        ) {
          await this.save(
            "pause",
            { reason: "State changed before execution" },
            { mode: "paused", reason: "Stale intent was not executed" },
          );
          return;
        }
        this.expected = { id, candidate, before: snapshot };
        this.ports.execute(candidate);
        this.armTimeout(
          "No observed request/response after execution; not replaying",
        );
      });
    } catch (error) {
      await this.pause(
        error instanceof Error ? error.message : "Decision failed",
      );
    } finally {
      this.deciding = false;
    }
  }
  async observeManualChange() {
    if (
      this.broken ||
      !this.session ||
      this.session.mode === "ended" ||
      this.session.pending ||
      this.expected
    )
      return;
    const snapshot = this.ports.observe();
    if (snapshot.revision === this.session.last.revision) return;
    await this.serial(async () => {
      if (
        this.session?.pending ||
        snapshot.revision === this.session?.last.revision
      )
        return;
      await this.save(
        "gap",
        {
          reason: "State changed without a confirmed observed action",
          snapshot,
        },
        { last: snapshot, mode: "paused", reason: "Unattributed state change" },
      );
    });
  }
  async idle() {
    await this.queue;
  }
}
