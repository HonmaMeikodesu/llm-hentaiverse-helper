import { rpc } from "./rpc.js";
import { jevConnection } from "../automation/providers.js";
import {
  PreferenceVersion,
  Session,
  Settings,
  TraceEvent,
  ReplayReport,
} from "../automation/types.js";

const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id);
let draft: PreferenceVersion | null = null;
const reviewed = new Map<
  string,
  {
    condition: HTMLTextAreaElement;
    preference: HTMLTextAreaElement;
    accepted: HTMLInputElement;
  }
>();
let exported = false;
function message(text: string, error = false) {
  el("message").textContent = text;
  el("message").className = error ? "error" : "";
}
async function showTrace(id: string) {
  const events = await rpc<TraceEvent[]>("events", { sessionId: id });
  el("trace").textContent = JSON.stringify(events, null, 2);
  el("trace-cards").replaceChildren();
  const results = new Map(
    events
      .filter((e) => e.kind === "result")
      .map((e) => [(e.data as any).requestId, e.data as any]),
  );
  for (const event of events) {
    if (
      !["request", "gap", "interruption", "pause", "tab-closed"].includes(
        event.kind,
      )
    )
      continue;
    const d = event.data as any;
    const card = document.createElement("article");
    const line = (value: string) => {
      const p = document.createElement("p");
      p.textContent = value;
      card.append(p);
    };
    if (event.kind === "request") {
      const candidate = d.before.candidates.find(
        (c: any) => c.id === d.candidateId,
      );
      const target = d.before.monsters.find(
        (m: any) => m.id === candidate?.targetId,
      )?.name;
      line(
        `${d.source === "human" ? "你的操作" : "Jev 操作"} · ${candidate?.name || "未识别动作"}${target ? ` → ${target}` : ""}`,
      );
      line(
        `操作前 HP ${d.before.player.hp ?? "未知"} / MP ${d.before.player.mp ?? "未知"} / SP ${d.before.player.sp ?? "未知"}；${d.before.monsters.filter((m: any) => m.targetable).length} 个可选敌人`,
      );
      const outcome = results.get(d.requestId);
      line(
        outcome?.ok
          ? `已确认。操作后 HP ${outcome.after.player.hp ?? "未知"} / MP ${outcome.after.player.mp ?? "未知"} / SP ${outcome.after.player.sp ?? "未知"}`
          : "结果未确认，不作为完整示范用于归纳",
      );
      const alternatives = document.createElement("details"),
        title = document.createElement("summary"),
        body = document.createElement("p");
      title.textContent = `当时可选的 ${d.before.candidates.length} 个动作`;
      body.textContent = d.before.candidates
        .map(
          (c: any) =>
            `${c.name}${c.targetId ? ` → ${d.before.monsters.find((m: any) => m.id === c.targetId)?.name || c.targetId}` : ""}（MP ${c.manaCost ?? "未知"}）`,
        )
        .join("；");
      alternatives.append(title, body);
      card.append(alternatives);
    } else line(`记录提示：${d.reason || "页面中断或记录存在缺口"}`);
    const reference = document.createElement("small");
    reference.textContent = `证据 ${event.id}`;
    card.append(reference);
    el("trace-cards").append(card);
  }
  el<HTMLDetailsElement>("trace-review").open = true;
}
function action(id: string, run: () => Promise<void>) {
  el<HTMLButtonElement>(id).onclick = async () => {
    const button = el<HTMLButtonElement>(id);
    button.disabled = true;
    message("处理中…");
    try {
      await run();
    } catch (e) {
      message(e instanceof Error ? e.message : "操作失败", true);
    } finally {
      button.disabled = id === "confirm" && !draft;
    }
  };
}
function renderDraft(version: PreferenceVersion | null) {
  draft = version;
  reviewed.clear();
  el("preferences").replaceChildren();
  el<HTMLButtonElement>("confirm").disabled =
    !version || !version.preferences.length;
  if (!version?.preferences.length) {
    el("preferences").textContent =
      "暂无待审阅偏好。先录制并归纳一批示范；证据不足时可能不会生成偏好。";
    return;
  }
  for (const p of version.preferences) {
    const card = document.createElement("article");
    const label = document.createElement("label");
    const accepted = document.createElement("input");
    accepted.type = "checkbox";
    accepted.checked = false;
    label.append(accepted, " 我认可这条取舍（可先编辑）");
    card.append(label);
    const field = (caption: string, value: string) => {
      const label = document.createElement("label");
      label.textContent = caption;
      const area = document.createElement("textarea");
      area.rows = 2;
      area.maxLength = 1500;
      area.value = value;
      label.append(area);
      card.append(label);
      return area;
    };
    const condition = field("适用条件", p.condition),
      preference = field("倾向的取舍", p.preference);
    const evidence = document.createElement("p");
    evidence.className = "evidence";
    evidence.textContent = `支持记录：${p.evidence.join("、")}。反例：${p.counterEvidence.join("、") || "未列出，不代表不存在"}。`;
    card.append(evidence);
    for (const source of version.sourceSessions) {
      const b = document.createElement("button");
      b.textContent = `查看来源 ${source.slice(0, 8)}`;
      b.onclick = async () => {
        try {
          await showTrace(source);
          el("trace-review").scrollIntoView();
        } catch (e) {
          message(String(e), true);
        }
      };
      card.append(b);
    }
    reviewed.set(p.id, { accepted, condition, preference });
    el("preferences").append(card);
  }
}
async function renderReplays() {
  const reports = await rpc<ReplayReport[]>("get-replays");
  el("replay-results").replaceChildren();
  if (!reports.length) {
    el("replay-results").textContent = "暂无对照记录。";
    return;
  }
  for (const report of reports.slice(-3).reverse()) {
    const header = document.createElement("p");
    header.textContent = `${new Date(report.at).toLocaleString("zh-CN")} · ${report.status === "complete" ? "完成" : "尚未完成"} · ${report.cases.length} 个局面`;
    el("replay-results").append(header);
    for (const entry of report.cases) {
      const card = document.createElement("article");
      const describe = (id: string) => {
        const c = entry.before.candidates.find((c) => c.id === id);
        return c
          ? `${c.name}${c.targetId ? ` → ${entry.before.monsters.find((m) => m.id === c.targetId)?.name || c.targetId}` : ""}`
          : id;
      };
      for (const text of [
        `HP ${entry.before.player.hp} / MP ${entry.before.player.mp}；${entry.before.monsters.filter((m) => m.targetable).length} 个敌人`,
        `你的当时选择：${describe(entry.human)}`,
        `未个性化建议：${describe(entry.baseline.candidateId)}`,
        `参考偏好和示范：${describe(entry.personalized.candidateId)}`,
      ]) {
        const line = document.createElement("p");
        line.textContent = text;
        card.append(line);
      }
      const button = document.createElement("button");
      button.textContent = "查看原局面与可选动作";
      button.onclick = () =>
        void showTrace(report.sessionId).catch((e) => message(e.message, true));
      card.append(button);
      el("replay-results").append(card);
    }
  }
}
async function refresh() {
  const status = await rpc("status");
  const settings: Settings = status.settings;
  const values: Record<string, string> = {
    "profile-name": status.profile.name,
    "profile-description": status.profile.configuration,
    "jev-key": settings.jevKey,
    "jev-provider": settings.jevProvider,
    "jev-model": settings.jevModel,
    "summary-key": settings.summaryKey,
    "summary-model": settings.summaryModel,
    "summary-endpoint": settings.summaryEndpoint,
    "input-price": settings.summaryInputPrice?.toString() || "",
    "output-price": settings.summaryOutputPrice?.toString() || "",
  };
  for (const [id, value] of Object.entries(values)) input(id).value = value;
  el("cost").textContent =
    `本月估算模型费用 $${status.knownUSD.toFixed(4)}；${status.unknownRequests} 次费用待核对。${status.reminder ? "已超过 $5 提醒线，继续调用。" : "$5 为提醒线，不是支出上限。"}`;
  const preferences =
    status.preferences?.preferences.filter(
      (p: any) => p.status === "confirmed",
    ) || [];
  el("active-preferences").textContent =
    `当前配置：${status.profile.name}；已确认 ${preferences.length} 条偏好。${preferences.map((p: any) => `${p.condition}：${p.preference}`).join("；")}`;
  el("sessions").replaceChildren();
  for (const session of status.sessions as Session[]) {
    const row = document.createElement("tr");
    const choice = document.createElement("input");
    choice.type = "checkbox";
    choice.value = session.id;
    choice.name = "session";
    choice.disabled =
      session.purpose === "diagnostic" ||
      session.mode !== "ended" ||
      session.profile.id !== status.profile.id;
    const cell = document.createElement("td");
    cell.append(choice);
    row.append(cell);
    for (const value of [
      new Date(session.at).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      }),
      session.profile.name +
        (session.purpose === "diagnostic" ? " · 无偏好测试" : ""),
      { record: "录制中", auto: "接管中", paused: "暂停", ended: "已结束" }[
        session.mode
      ],
      String(session.seq),
    ]) {
      const td = document.createElement("td");
      td.textContent = value;
      row.append(td);
    }
    const buttons = document.createElement("td");
    const view = document.createElement("button");
    view.textContent = "查看";
    view.onclick = async () => {
      try {
        await showTrace(session.id);
      } catch (e) {
        message(String(e), true);
      }
    };
    buttons.append(view);
    if (session.mode !== "ended") {
      const end = document.createElement("button");
      end.textContent = "结束记录";
      end.onclick = async () => {
        try {
          await rpc("end-session", { sessionId: session.id });
          await refresh();
        } catch (e) {
          message(String(e), true);
        }
      };
      buttons.append(end);
    }
    const remove = document.createElement("button");
    remove.textContent = "清理";
    remove.disabled = session.mode !== "ended";
    remove.onclick = async () => {
      if (!exported) {
        message("请先导出记录，再清理本机副本。", true);
        return;
      }
      if (!confirm("清理这场已结束的本机记录？请确认导出文件已保存。")) return;
      try {
        await rpc("delete-session", { sessionId: session.id });
        await refresh();
        message("本机副本已清理");
      } catch (e) {
        message(String(e), true);
      }
    };
    buttons.append(remove);
    row.append(buttons);
    el("sessions").append(row);
  }
  const storedDraft = await rpc("get-draft");
  await renderReplays();
  renderDraft(
    storedDraft?.profileId === status.profile.id ? storedDraft.version : null,
  );
}
action("refresh", async () => {
  await refresh();
  message("已刷新");
});
action("save", async () => {
  const endpoint = new URL(input("summary-endpoint").value);
  if (endpoint.protocol !== "https:") throw new Error("归纳接口必须使用 HTTPS");
  const granted = await chrome.permissions.request({
    origins: [
      ...new Set([
        `${endpoint.origin}/*`,
        `${new URL(jevConnection({ jevProvider: el<HTMLSelectElement>("jev-provider").value as Settings["jevProvider"], jevModel: input("jev-model").value }).endpoint).origin}/*`,
      ]),
    ],
  });
  if (!granted) throw new Error("未获得归纳接口的访问权限");
  const price = (id: string) =>
    input(id).value.trim() === "" ? null : Number(input(id).value);
  await rpc("save-settings", {
    settings: {
      jevProvider: el<HTMLSelectElement>("jev-provider").value,
      jevKey: input("jev-key").value.trim(),
      jevModel: input("jev-model").value.trim(),
      summaryKey: input("summary-key").value.trim(),
      summaryEndpoint: endpoint.href,
      summaryModel: input("summary-model").value.trim(),
      summaryInputPrice: price("input-price"),
      summaryOutputPrice: price("output-price"),
    },
    profile: {
      name: input("profile-name").value,
      configuration: input("profile-description").value,
    },
  });
  await refresh();
  message("设置已保存");
});
el<HTMLSelectElement>("jev-provider").onchange = () => {
  input("jev-model").value =
    el<HTMLSelectElement>("jev-provider").value === "vercel"
      ? "typesafe-ai/jev"
      : "jev-1.13.0";
};
el("vercel-preset").onclick = () => {
  el<HTMLSelectElement>("jev-provider").value = "vercel";
  input("jev-model").value = "typesafe-ai/jev";
  input("summary-endpoint").value =
    "https://ai-gateway.vercel.sh/v1/chat/completions";
  input("summary-model").value = "google/gemini-3-flash";
  input("input-price").value = "0.5";
  input("output-price").value = "3";
  message(
    "Vercel 预设已填入。请在两个 Key 栏填写 AI Gateway Key，然后保存。单价为当前公开估算，优先使用网关返回的费用。",
  );
};
action("export", async () => {
  const data = await rpc("export");
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `hv-helper-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
  exported = true;
  message("导出已开始，请检查下载文件");
});
action("summarize", async () => {
  const ids = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="session"]:checked',
    ),
  ).map((e) => e.value);
  const version = await rpc<PreferenceVersion>("summarize", {
    sessionIds: ids,
  });
  renderDraft(version);
  message(
    version.preferences.length
      ? "归纳完成，请审阅并确认。"
      : "当前证据不足，未生成偏好。可以再录制不同局面。",
  );
});
action("replay", async () => {
  const ids = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="session"]:checked',
    ),
  ).map((e) => e.value);
  if (ids.length !== 1) throw new Error("请选择一场未参与偏好归纳的记录");
  await rpc("replay", { sessionId: ids[0] });
  await renderReplays();
  message("对照回放完成，未执行任何游戏动作。");
});
action("confirm", async () => {
  if (!draft) return;
  const preferences = draft.preferences.map((p) => {
    const edit = reviewed.get(p.id)!;
    return {
      id: p.id,
      condition: edit.condition.value,
      preference: edit.preference.value,
      status: edit.accepted.checked ? "confirmed" : "rejected",
    };
  });
  await rpc("confirm-preferences", { draftId: draft.id, preferences });
  await refresh();
  message("审阅结果已保存，将用于后续新开的接管会话。");
});
void refresh().catch((e) => message(e.message, true));
