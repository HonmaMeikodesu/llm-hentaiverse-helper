import { Journal } from "../automation/journal.js";
import { jevConnection } from "../automation/providers.js";
import {
  decisionRequest,
  demonstrationPairs,
  paidJSON,
  parseDecision,
  parsePreferences,
  selectExamples,
  summaryRequest,
} from "../automation/decision.js";
import {
  PreferenceVersion,
  Profile,
  ReplayReport,
  Session,
  Settings,
  Usage,
  now,
  uid,
} from "../automation/types.js";

const journal = new Journal();
const inFlight = new Set<string>();
const optionsURL = chrome.runtime.getURL("extension/options.html");
async function profile(): Promise<Profile> {
  return journal.profile();
}
async function handle(
  type: string,
  p: any,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  const options = sender.url?.split("?")[0] === optionsURL;
  const tabId = sender.tab?.id;
  if (
    !options &&
    (tabId === undefined ||
      !sender.url ||
      !/^https?:\/\/(?:hentaiverse\.org|127\.0\.0\.1:7001)(?:\/|$)/.test(
        sender.url,
      ))
  )
    throw new Error("Unsupported sender");
  if (type === "open-options") {
    await chrome.runtime.openOptionsPage();
    return true;
  }
  if (type === "status") {
    const config = await journal.settings();
    const current = await profile();
    const allUsage = await journal.list<Usage>("usage");
    const month = new Date()
      .toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" })
      .slice(0, 7);
    const usage = allUsage.filter((u) =>
      new Date(u.at)
        .toLocaleDateString("sv-SE", { timeZone: "Asia/Shanghai" })
        .startsWith(month),
    );
    const knownUSD = usage.reduce((sum, u) => sum + (u.usd ?? 0), 0);
    return {
      profile: current,
      preferences: await journal.currentPreferences(current.id),
      jevConfigured: !!config.jevKey,
      summaryConfigured: !!config.summaryKey,
      knownUSD,
      unknownRequests: usage.filter((u) => u.usd === null).length,
      reminder: knownUSD >= 5,
      sessions: options
        ? (await journal.list<Session>("sessions")).sort((a, b) =>
            b.at.localeCompare(a.at),
          )
        : undefined,
      settings: options ? config : undefined,
    };
  }
  if (type === "attach" && tabId !== undefined)
    return journal.attach(tabId, p.pageId, p.snapshot);
  if (type === "start" && tabId !== undefined) {
    const purpose = p.purpose === "diagnostic" ? "diagnostic" : "play";
    if (
      !["record", "auto"].includes(p.mode) ||
      p.snapshot?.stage !== "battle" ||
      !p.pageId ||
      (purpose === "diagnostic" && p.mode !== "auto")
    )
      throw new Error("Start on an active battle page");
    const current = await profile();
    const preferences =
      purpose === "diagnostic"
        ? null
        : await journal.currentPreferences(current.id);
    if (
      p.mode === "auto" &&
      purpose !== "diagnostic" &&
      !preferences?.preferences.some((x) => x.status === "confirmed")
    )
      throw new Error("请先录制示范并确认至少一条偏好");
    if (p.mode === "auto" && !(await journal.settings()).jevKey)
      throw new Error("请先配置 Jev API Key");
    return journal.create(
      tabId,
      p.pageId,
      p.mode,
      p.snapshot,
      current,
      preferences,
      purpose,
    );
  }
  if (["append", "decide"].includes(type) && tabId !== undefined) {
    const session = await journal.session(p.sessionId);
    if (
      !session ||
      session.tabId !== tabId ||
      session.pageId !== p.pageId ||
      session.mode === "ended"
    )
      throw new Error("Session is not owned by this page");
    if (type === "append") {
      const allowed = [
        "decision-start",
        "decision",
        "intent",
        "request",
        "result",
        "pause",
        "resume",
        "end",
        "battle-ended",
        "gap",
        "round-advance-intent",
      ];
      if (!allowed.includes(p.kind))
        throw new Error("Unsupported journal event");
      const patch: Partial<Session> = {};
      for (const key of [
        "mode",
        "pending",
        "last",
        "advanceFrom",
        "reason",
      ] as const)
        if (p.patch && key in p.patch) (patch as any)[key] = p.patch[key];
      if (
        patch.mode === "auto" &&
        session.purpose !== "diagnostic" &&
        !session.preferences?.preferences.some((x) => x.status === "confirmed")
      )
        throw new Error(
          "This session has no confirmed preferences; end it and start takeover after review",
        );
      return journal.append(session.id, p.pageId, p.kind, p.data, patch);
    }
    if (
      session.mode !== "auto" ||
      (session.purpose === "diagnostic" &&
        (session.confirmedActions || 0) >= 5) ||
      session.pending ||
      session.last.revision !== p.snapshot?.revision ||
      inFlight.has(session.id)
    )
      throw new Error("Decision is not permitted for this session state");
    inFlight.add(session.id);
    try {
      const settings = await journal.settings();
      if (!settings.jevKey) throw new Error("Missing Jev key");
      const connection = jevConnection(settings);
      if (
        !(await chrome.permissions.contains({
          origins: [`${new URL(connection.endpoint).origin}/*`],
        }))
      )
        throw new Error("请在设置中保存并授权 Jev 服务商域名");
      const demonstrations = (await journal.list<Session>("sessions"))
        .filter(
          (s) =>
            s.id !== session.id &&
            s.purpose !== "diagnostic" &&
            session.preferences?.sourceSessions.includes(s.id) &&
            s.profile.id === session.profile.id &&
            s.mode === "ended",
        )
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 3);
      const events = (
        await Promise.all(demonstrations.map((s) => journal.events(s.id)))
      ).flat();
      const request = {
        model: settings.jevModel,
        ...decisionRequest(
          p.snapshot,
          session,
          selectExamples(events, p.snapshot),
        ),
      };
      const response = await paidJSON(
        connection.endpoint,
        settings.jevKey,
        request,
        session.purpose === "diagnostic" ? "evaluation" : "decision",
        connection.prices,
        (u) => journal.usage(u),
      );
      return parseDecision(response.body, p.snapshot, response.usageId);
    } finally {
      inFlight.delete(session.id);
    }
  }
  if (!options)
    throw new Error("This operation is only available in extension settings");
  if (type === "save-settings") {
    const old = await journal.settings();
    const config: Settings = { ...old, ...p.settings };
    jevConnection(config);
    const endpoint = new URL(config.summaryEndpoint);
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new Error(
        "Use an HTTPS endpoint without credentials or query parameters",
      );
    if (!config.jevModel.trim() || !config.summaryModel.trim())
      throw new Error("Model name is required");
    for (const price of [config.summaryInputPrice, config.summaryOutputPrice])
      if (price !== null && (!Number.isFinite(price) || price < 0))
        throw new Error("Invalid model price");
    const previous = await profile();
    const name = String(p.profile.name).trim(),
      configuration = String(p.profile.configuration).trim();
    if (!name || !configuration || configuration.length > 8000)
      throw new Error("配置名称和描述不能为空，描述不超过8000字");
    await journal.set("settings", config);
    if (name !== previous.name || configuration !== previous.configuration)
      await journal.set("profile", { id: uid(), name, configuration });
    return true;
  }
  if (type === "export") return journal.export();
  if (type === "get-replays")
    return (await journal.get<ReplayReport[]>("replays")) || [];
  if (type === "replay") {
    const current = await profile();
    const session = await journal.session(p.sessionId);
    const preferences = await journal.currentPreferences(current.id);
    if (
      !session ||
      session.purpose === "diagnostic" ||
      session.mode !== "ended" ||
      session.profile.id !== current.id ||
      !preferences?.preferences.some((x) => x.status === "confirmed")
    )
      throw new Error("请选择一场已结束的同配置人工记录，并先确认偏好");
    if (preferences.sourceSessions.includes(session.id))
      throw new Error("请使用未参与本批偏好归纳的另一场完整记录作对照");
    if (inFlight.has("replay")) throw new Error("对照回放正在进行");
    const pairs = demonstrationPairs(await journal.events(session.id));
    if (!pairs.length) throw new Error("记录中没有可确认的人工动作");
    inFlight.add("replay");
    const report: ReplayReport = {
      id: uid(),
      at: now(),
      sessionId: session.id,
      preferenceVersionId: preferences.id,
      status: "running",
      cases: [],
    };
    try {
      const settings = await journal.settings();
      if (!settings.jevKey) throw new Error("Missing Jev key");
      const events = (
        await Promise.all(
          preferences.sourceSessions.map((id) => journal.events(id)),
        )
      ).flat();
      const count = Math.min(5, pairs.length);
      await journal.replay(report);
      for (let i = 0; i < count; i++) {
        const pair =
          pairs[
            count === 1 ? 0 : Math.floor((i * (pairs.length - 1)) / (count - 1))
          ];
        const choose = async (personal: boolean) => {
          const request = {
            model: settings.jevModel,
            ...decisionRequest(
              pair.before,
              {
                profile: session.profile,
                preferences: personal ? preferences : null,
              },
              personal ? selectExamples(events, pair.before) : [],
            ),
          };
          const response = await paidJSON(
            jevConnection(settings).endpoint,
            settings.jevKey,
            request,
            "evaluation",
            jevConnection(settings).prices,
            (u) => journal.usage(u),
          );
          return parseDecision(response.body, pair.before, response.usageId);
        };
        const baseline = await choose(false),
          personalized = await choose(true);
        report.cases.push({
          evidence: pair.evidence,
          before: pair.before,
          human: pair.candidateId,
          baseline,
          personalized,
        });
        await journal.replay(report);
      }
      report.status = "complete";
      await journal.replay(report);
      return report;
    } catch (error) {
      report.status = "interrupted";
      await journal.replay(report);
      throw error;
    } finally {
      inFlight.delete("replay");
    }
  }
  if (type === "events") return journal.events(String(p.sessionId));
  if (type === "end-session") {
    const session = await journal.session(p.sessionId);
    if (session && session.mode !== "ended")
      await journal.append(
        session.id,
        session.pageId,
        "end",
        { reason: "Closed from settings", unresolvedAction: session.pending },
        { mode: "ended", reason: "用户从设置结束记录" },
      );
    return true;
  }
  if (type === "delete-session") {
    await journal.removeSession(p.sessionId);
    return true;
  }
  if (type === "summarize") {
    const ids: string[] = [...new Set<string>(p.sessionIds || [])];
    if (!ids.length || ids.length > 10)
      throw new Error("选择1到10场已结束的同配置示范");
    const current = await profile();
    const sessions = await Promise.all(ids.map((id) => journal.session(id)));
    if (
      sessions.some(
        (s) =>
          !s ||
          s.purpose === "diagnostic" ||
          s.mode !== "ended" ||
          s.profile.id !== current.id,
      )
    )
      throw new Error(
        "Only ended sessions of the current configuration can be summarized",
      );
    if (inFlight.has("summary"))
      throw new Error("A summary is already running");
    inFlight.add("summary");
    try {
      const pairs = demonstrationPairs(
        (await Promise.all(ids.map((id) => journal.events(id)))).flat(),
      );
      const settings = await journal.settings();
      if (!settings.summaryKey) throw new Error("Missing summary model key");
      if (
        !(await chrome.permissions.contains({
          origins: [`${new URL(settings.summaryEndpoint).origin}/*`],
        }))
      )
        throw new Error("请在设置中保存并授权归纳接口域名");
      const request = summaryRequest(
        pairs,
        current.configuration,
        settings.summaryModel,
      );
      const response = await paidJSON(
        settings.summaryEndpoint,
        settings.summaryKey,
        request,
        "summary",
        [settings.summaryInputPrice, settings.summaryOutputPrice],
        (u) => journal.usage(u),
      );
      const content = response.body?.choices?.[0]?.message?.content;
      if (typeof content !== "string")
        throw new Error(
          "Summary endpoint did not return chat completion content",
        );
      const shown = JSON.parse(request.messages[1].content).examples as {
        evidence: string;
      }[];
      const version = parsePreferences(
        content,
        new Set(shown.map((x) => x.evidence)),
        ids,
      );
      await journal.preferences(version, current.id, false);
      await journal.set("draft", { profileId: current.id, version });
      return version;
    } finally {
      inFlight.delete("summary");
    }
  }
  if (type === "get-draft") return (await journal.get("draft")) || null;
  if (type === "confirm-preferences") {
    const draft = await journal.get<{
      profileId: string;
      version: PreferenceVersion;
    }>("draft");
    const current = await profile();
    if (
      !draft ||
      draft.profileId !== current.id ||
      draft.version.id !== p.draftId ||
      !Array.isArray(p.preferences) ||
      p.preferences.length !== draft.version.preferences.length
    )
      throw new Error("Preference draft changed; refresh before saving");
    const preferences = draft.version.preferences.map((original, i) => {
      const edit = p.preferences[i];
      if (
        edit.id !== original.id ||
        !["confirmed", "rejected"].includes(edit.status) ||
        typeof edit.condition !== "string" ||
        !edit.condition.trim() ||
        edit.condition.length > 1500 ||
        typeof edit.preference !== "string" ||
        !edit.preference.trim() ||
        edit.preference.length > 1500
      )
        throw new Error("Invalid preference review");
      return {
        ...original,
        condition: edit.condition,
        preference: edit.preference,
        status: edit.status,
      };
    });
    const version: PreferenceVersion = {
      ...draft.version,
      id: uid(),
      at: now(),
      preferences,
    };
    await journal.preferences(version, current.id, true);
    await journal.set("draft", null);
    return version;
  }
  throw new Error("Unknown operation");
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.scope !== "hv-helper") return;
  handle(message.type, message.payload || {}, sender).then(
    (value) => respond({ ok: true, value }),
    (error) =>
      respond({
        ok: false,
        error: error instanceof Error ? error.message : "Operation failed",
      }),
  );
  return true;
});
chrome.action.onClicked.addListener(
  () => void chrome.runtime.openOptionsPage(),
);
chrome.tabs.onRemoved.addListener((tabId) => {
  void journal
    .active(tabId)
    .then(async (session) => {
      if (session && session.mode !== "ended")
        await journal.append(
          session.id,
          session.pageId,
          "tab-closed",
          { unresolvedAction: session.pending },
          { mode: "ended", reason: "游戏标签页已关闭；未完成动作保留为未知" },
        );
    })
    .catch(() => {
      /* Durable pending state remains recoverable from settings. */
    });
});
