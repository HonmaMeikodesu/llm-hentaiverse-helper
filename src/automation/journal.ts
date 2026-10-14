import {
  DEFAULT_SETTINGS,
  PreferenceVersion,
  Profile,
  ReplayReport,
  Session,
  Settings,
  Snapshot,
  TraceEvent,
  Usage,
  now,
  uid,
} from "./types.js";

const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
export class Journal {
  private connection: Promise<IDBDatabase>;
  constructor(factory: IDBFactory = indexedDB, name = "hv-helper-v1") {
    this.connection = new Promise((resolve, reject) => {
      const r = factory.open(name, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        db.createObjectStore("sessions", { keyPath: "id" });
        db.createObjectStore("events", { keyPath: "id" }).createIndex(
          "sessionId",
          "sessionId",
        );
        db.createObjectStore("usage", { keyPath: "id" });
        db.createObjectStore("preferences", { keyPath: "id" });
        db.createObjectStore("meta");
      };
      r.onsuccess = () => {
        r.result.onversionchange = () => r.result.close();
        resolve(r.result);
      };
      r.onerror = () => reject(r.error);
      r.onblocked = () =>
        reject(
          new Error("Local database upgrade blocked by another extension page"),
        );
    });
  }
  private async transaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    run: (tx: IDBTransaction) => Promise<T>,
  ): Promise<T> {
    const db = await this.connection;
    const tx = db.transaction(stores, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error("Local write aborted"));
      tx.onerror = () => {
        /* abort reports the error */
      };
    });
    // Observe rejection immediately, including when a request fails before awaiting done.
    void done.catch(() => {});
    try {
      const value = await run(tx);
      await done;
      return value;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* already finished */
      }
      await done.catch(() => {});
      throw error;
    }
  }
  async get<T>(key: string): Promise<T | undefined> {
    return this.transaction(["meta"], "readonly", (tx) =>
      result(tx.objectStore("meta").get(key)),
    );
  }
  async set(key: string, value: unknown): Promise<void> {
    await this.transaction(["meta"], "readwrite", async (tx) => {
      await result(tx.objectStore("meta").put(value, key));
    });
  }
  async settings(): Promise<Settings> {
    return { ...DEFAULT_SETTINGS, ...(await this.get<Settings>("settings")) };
  }
  async profile(): Promise<Profile> {
    return this.transaction(["meta"], "readwrite", async (tx) => {
      const store = tx.objectStore("meta");
      let p = (await result(store.get("profile"))) as Profile | undefined;
      if (!p) {
        p = {
          id: uid(),
          name: "当前固定配置",
          configuration:
            "尚未填写装备流派、难度和能力。模型应将这些信息视为未知。",
        };
        await result(store.put(p, "profile"));
      }
      return p;
    });
  }
  async list<T>(store: "sessions" | "usage" | "preferences"): Promise<T[]> {
    return this.transaction([store], "readonly", (tx) =>
      result(tx.objectStore(store).getAll()),
    );
  }
  async session(id: string): Promise<Session | undefined> {
    return this.transaction(["sessions"], "readonly", (tx) =>
      result(tx.objectStore("sessions").get(id)),
    );
  }
  async active(tabId: number): Promise<Session | undefined> {
    const id = await this.get<string>(`tab:${tabId}`);
    return id ? this.session(id) : undefined;
  }
  async create(
    tabId: number,
    pageId: string,
    mode: "record" | "auto",
    snapshot: Snapshot,
    profile: Profile,
    preferences: PreferenceVersion | null,
    purpose: "play" | "diagnostic" = "play",
  ): Promise<Session> {
    return this.transaction(
      ["sessions", "events", "meta"],
      "readwrite",
      async (tx) => {
        const oldId = await result(tx.objectStore("meta").get(`tab:${tabId}`));
        const others = (await result(
          tx.objectStore("sessions").getAll(),
        )) as Session[];
        if (others.some((s) => s.tabId !== tabId && s.mode !== "ended"))
          throw new Error("另一个标签页存在未结束记录，请先在设置中结束它");
        if (oldId) {
          const old = (await result(tx.objectStore("sessions").get(oldId))) as
            | Session
            | undefined;
          if (old && old.mode !== "ended")
            throw new Error("End or resume the existing session first");
        }
        const session: Session = {
          id: uid(),
          tabId,
          pageId,
          at: now(),
          updatedAt: now(),
          mode,
          purpose,
          confirmedActions: 0,
          seq: 1,
          profile,
          preferences,
          pending: null,
          last: snapshot,
          advanceFrom: null,
          reason: null,
        };
        await result(tx.objectStore("sessions").add(session));
        await result(
          tx.objectStore("events").add({
            id: `${session.id}:1`,
            sessionId: session.id,
            seq: 1,
            at: now(),
            kind: "start",
            data: {
              snapshot,
              mode,
              purpose,
              profile,
              preferenceVersion: preferences?.id || null,
            },
          } satisfies TraceEvent),
        );
        await result(tx.objectStore("meta").put(session.id, `tab:${tabId}`));
        return session;
      },
    );
  }
  async append(
    id: string,
    pageId: string,
    kind: string,
    data: unknown,
    patch: Partial<
      Pick<Session, "mode" | "pending" | "last" | "advanceFrom" | "reason">
    > = {},
  ): Promise<Session> {
    return this.transaction(["sessions", "events"], "readwrite", async (tx) => {
      const session = (await result(tx.objectStore("sessions").get(id))) as
        | Session
        | undefined;
      if (!session || session.pageId !== pageId)
        throw new Error("Session was replaced by another page");
      if (session.mode === "ended") throw new Error("Session already ended");
      const next = {
        ...session,
        ...patch,
        updatedAt: now(),
        seq: session.seq + 1,
        confirmedActions:
          (session.confirmedActions || 0) +
          (kind === "result" &&
          (data as any)?.ok === true &&
          (data as any)?.source === "jev"
            ? 1
            : 0),
      };
      await result(
        tx.objectStore("events").add({
          id: `${id}:${next.seq}`,
          sessionId: id,
          seq: next.seq,
          at: now(),
          kind,
          data,
        } satisfies TraceEvent),
      );
      await result(tx.objectStore("sessions").put(next));
      return next;
    });
  }
  async attach(
    tabId: number,
    pageId: string,
    snapshot: Snapshot,
  ): Promise<Session | null> {
    return this.transaction(
      ["meta", "sessions", "events"],
      "readwrite",
      async (tx) => {
        const id = await result(tx.objectStore("meta").get(`tab:${tabId}`));
        const s = id
          ? ((await result(tx.objectStore("sessions").get(id))) as
              | Session
              | undefined)
          : undefined;
        if (!s || s.mode === "ended") return null;
        const roundAdvance =
          s.advanceFrom !== null &&
          snapshot.round === s.advanceFrom + 1 &&
          snapshot.totalRounds === s.last.totalRounds &&
          snapshot.stage === "battle" &&
          s.pending === null;
        const next: Session = {
          ...s,
          pageId,
          seq: s.seq + 1,
          last: snapshot,
          advanceFrom: null,
          updatedAt: now(),
          mode: roundAdvance ? s.mode : "paused",
          reason: roundAdvance
            ? null
            : "Page reloaded; inspect the interruption before resuming",
        };
        await result(tx.objectStore("sessions").put(next));
        await result(
          tx.objectStore("events").add({
            id: `${id}:${next.seq}`,
            sessionId: id,
            seq: next.seq,
            at: now(),
            kind: roundAdvance ? "round-arrived" : "interruption",
            data: {
              snapshot,
              unresolvedAction: s.pending,
              previousPage: s.pageId,
            },
          } satisfies TraceEvent),
        );
        return next;
      },
    );
  }
  async events(id: string): Promise<TraceEvent[]> {
    const events = (await this.transaction(["events"], "readonly", (tx) =>
      result(tx.objectStore("events").index("sessionId").getAll(id)),
    )) as TraceEvent[];
    return events.sort((a, b) => a.seq - b.seq);
  }
  async usage(usage: Usage): Promise<void> {
    await this.transaction(["usage"], "readwrite", async (tx) => {
      await result(tx.objectStore("usage").put(usage));
    });
  }
  async preferences(
    version: PreferenceVersion,
    profileId: string,
    activate: boolean,
  ): Promise<void> {
    await this.transaction(["preferences", "meta"], "readwrite", async (tx) => {
      await result(tx.objectStore("preferences").add(version));
      if (activate)
        await result(
          tx.objectStore("meta").put(version.id, `preferences:${profileId}`),
        );
    });
  }
  async currentPreferences(
    profileId: string,
  ): Promise<PreferenceVersion | null> {
    const id = await this.get<string>(`preferences:${profileId}`);
    return id
      ? this.transaction(["preferences"], "readonly", (tx) =>
          result(tx.objectStore("preferences").get(id)),
        )
      : null;
  }
  async export(): Promise<unknown> {
    return this.transaction(
      ["sessions", "events", "preferences", "usage", "meta"],
      "readonly",
      async (tx) => ({
        schemaVersion: 1,
        exportedAt: now(),
        sessions: await result(tx.objectStore("sessions").getAll()),
        events: await result(tx.objectStore("events").getAll()),
        preferences: await result(tx.objectStore("preferences").getAll()),
        usage: await result(tx.objectStore("usage").getAll()),
        replays: (await result(tx.objectStore("meta").get("replays"))) || [],
      }),
    );
  }
  async replay(report: ReplayReport): Promise<void> {
    await this.transaction(["meta"], "readwrite", async (tx) => {
      const store = tx.objectStore("meta");
      const reports = ((await result(store.get("replays"))) ||
        []) as ReplayReport[];
      await result(
        store.put(
          [...reports.filter((r) => r.id !== report.id), report],
          "replays",
        ),
      );
    });
  }
  async removeSession(id: string): Promise<void> {
    await this.transaction(
      ["sessions", "events", "preferences", "meta"],
      "readwrite",
      async (tx) => {
        const session = (await result(tx.objectStore("sessions").get(id))) as
          | Session
          | undefined;
        if (!session || session.mode !== "ended")
          throw new Error("Only ended sessions can be deleted");
        const versions = (await result(
          tx.objectStore("preferences").getAll(),
        )) as PreferenceVersion[];
        if (versions.some((v) => v.sourceSessions.includes(id)))
          throw new Error("这场记录仍是偏好版本的证据，暂不能清理");
        const reports = ((await result(
          tx.objectStore("meta").get("replays"),
        )) || []) as ReplayReport[];
        if (reports.some((r) => r.sessionId === id))
          throw new Error("这场记录仍被对照回放引用，暂不能清理");
        for (const key of await result(
          tx.objectStore("events").index("sessionId").getAllKeys(id),
        ))
          await result(tx.objectStore("events").delete(key));
        await result(tx.objectStore("sessions").delete(id));
      },
    );
  }
}
