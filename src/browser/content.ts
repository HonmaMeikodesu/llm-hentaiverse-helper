import { observe } from "../automation/observe.js";
import { BattleEngine } from "../automation/engine.js";
import { advanceRound, execute } from "../automation/execute.js";
import { BRIDGE, BridgeMessage } from "../automation/protocol.js";
import { Session } from "../automation/types.js";
import { rpc } from "../extension/rpc.js";

const pageId = crypto.randomUUID();
let bridgeReady = false;
let engine: BattleEngine;
let stateText: HTMLParagraphElement, detail: HTMLParagraphElement;
let costText: HTMLParagraphElement;
let lastMessage = "";
const current = () => observe(document, engine?.session?.last);
function display(session: Session | null, error: string | null) {
  if (!stateText) return;
  if (error) lastMessage = error;
  stateText.textContent = error
    ? "已暂停：记录或连接异常"
    : !session
      ? "待开始"
      : {
          record: "正在录制你的游玩",
          auto: "AI 接管中",
          paused: "已暂停",
          ended: "本场记录已结束",
        }[session.mode];
  detail.textContent =
    error ||
    session?.reason ||
    lastMessage ||
    "固定配置，手动开启一场战斗后选择录制或接管。";
  if (session?.purpose === "diagnostic")
    detail.textContent = `无偏好测试 ${session.confirmedActions || 0}/5 · 不用于学习你的打法。${detail.textContent}`;
}
window.addEventListener("message", (e) => {
  if (
    e.source !== window ||
    e.origin !== location.origin ||
    e.data?.channel !== BRIDGE
  )
    return;
  const message = e.data as BridgeMessage;
  if (message.kind === "ready") bridgeReady = true;
  else if (
    ["request", "response"].includes(message.kind) &&
    typeof message.requestId === "string"
  )
    engine?.receive(message);
});
window.postMessage({ channel: BRIDGE, kind: "ping" }, location.origin);

async function main() {
  const host = document.createElement("div");
  host.id = "hv-helper-panel";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent =
    ":host{position:fixed;right:12px;bottom:12px;z-index:2147483647;font:13px system-ui;color:#e8eef6}section{width:270px;padding:14px;background:#192332;border:1px solid #64748b;border-radius:10px;box-shadow:0 4px 20px #0005}h3{margin:0 0 10px}p{line-height:1.5;margin:6px 0;overflow-wrap:anywhere}button{margin:4px 4px 0 0;padding:6px 9px;border:1px solid #94a3b8;border-radius:5px;cursor:pointer;background:#edf2fa;color:#132033}button:disabled{opacity:.5}small{color:#a9bdd5}";
  shadow.append(style);
  const panel = document.createElement("section");
  const title = document.createElement("h3");
  title.textContent = "HV 策略助手";
  panel.append(title);
  stateText = document.createElement("p");
  detail = document.createElement("p");
  costText = document.createElement("p");
  panel.append(stateText, detail, costText);
  shadow.append(panel);
  document.documentElement.append(host);
  engine = new BattleEngine({
    observe: current,
    append: (kind, data, patch) =>
      rpc("append", {
        sessionId: engine.session?.id,
        pageId,
        kind,
        data,
        patch,
      }),
    decide: (snapshot) =>
      rpc("decide", { sessionId: engine.session?.id, pageId, snapshot }),
    execute: (candidate) => execute(document, candidate),
    advance: () => advanceRound(document),
    changed: display,
  });
  const button = (label: string, run: () => Promise<unknown>) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = async () => {
      b.disabled = true;
      lastMessage = "";
      try {
        await run();
      } catch (e) {
        display(engine.session, e instanceof Error ? e.message : "操作失败");
      } finally {
        b.disabled = false;
      }
    };
    panel.append(b);
  };
  const start = async (
    mode: "record" | "auto",
    purpose: "play" | "diagnostic" = "play",
  ) => {
    if (!bridgeReady) throw new Error("战斗记录桥未连接，请刷新页面后再开始");
    if (engine.session && engine.session.mode !== "ended") {
      if ((engine.session.purpose || "play") !== purpose)
        throw new Error("请先结束当前记录，再切换正式游玩或无偏好测试");
      await engine.resume(mode);
      return;
    }
    engine.install(
      await rpc<Session>("start", {
        pageId,
        mode,
        purpose,
        snapshot: current(),
      }),
    );
  };
  button("录制 / 恢复录制", () => start("record"));
  button("接管 / 恢复接管", () => start("auto"));
  button("无偏好测试（最多5步）", () => start("auto", "diagnostic"));
  button("暂停", () => engine.pause("用户暂停"));
  button("结束本场记录", () => engine.end());
  button("设置与偏好", () => rpc("open-options"));
  engine.install(
    await rpc<Session | null>("attach", {
      pageId,
      snapshot: observe(document),
    }),
  );
  const status = async () => {
    const s = await rpc("status");
    costText.textContent = `Jev ${s.jevConfigured ? "已配置" : "未配置"} · 归纳 ${s.summaryConfigured ? "已配置" : "未配置"} · 已确认 ${s.preferences?.preferences.filter((p: any) => p.status === "confirmed").length || 0} 条偏好。本月估算费用 $${s.knownUSD.toFixed(4)}${s.unknownRequests ? ` · ${s.unknownRequests} 次费用待核对` : ""}${s.reminder ? " · 已达 $5 提醒线，继续运行" : ""}`;
  };
  await status();
  const intercept = (e: Event) => {
    if (!e.isTrusted || e.composedPath().includes(host)) return;
    const target = e.target as Element | null;
    if (
      e.type === "keydown" &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")
    )
      return;
    if (
      engine.session?.mode === "record" &&
      current().stage === "round-end" &&
      (target?.closest("#btcp") ||
        (e.type === "keydown" &&
          ["Enter", " "].includes((e as KeyboardEvent).key)))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      void engine.continueRecordedRound();
      return;
    }
    if (!engine.isRunning) return;
    if (e.type === "keydown" || target?.closest("#battle_main, #battle_top")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      void engine.pause("检测到手动操作，已暂停接管；请再次执行你的操作");
    }
  };
  document.addEventListener("click", intercept, true);
  document.addEventListener("keydown", intercept, true);
  let pollBusy = false;
  setInterval(async () => {
    if (pollBusy) return;
    pollBusy = true;
    try {
      if (engine.isRunning) await engine.tick();
      else await engine.observeManualChange();
    } catch (e) {
      display(engine.session, e instanceof Error ? e.message : "观察失败");
    } finally {
      pollBusy = false;
    }
  }, 700);
  setInterval(
    () => void status().catch((e) => display(engine.session, e.message)),
    30000,
  );
}
if (document.readyState === "loading")
  document.addEventListener(
    "DOMContentLoaded",
    () =>
      void main().catch((e) =>
        console.error("HV helper initialization failed:", e.message),
      ),
    { once: true },
  );
else
  void main().catch((e) =>
    console.error("HV helper initialization failed:", e.message),
  );
