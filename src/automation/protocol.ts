import { Action } from "./types.js";
export const BRIDGE = "hv-helper-battle-v1";
export type BridgeMessage = {
  channel: typeof BRIDGE;
  kind: "ready" | "request" | "response";
  requestId: string;
  action?: Action;
  ok?: boolean;
  status?: number;
  reason?: string;
};
export function readAction(value: unknown): Action | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (
    v.type !== "battle" ||
    v.method !== "action" ||
    !["attack", "magic", "items", "spirit", "defend", "focus"].includes(
      String(v.mode),
    )
  )
    return null;
  const target = Number(v.target ?? 0),
    skill = String(v.skill ?? "0").replace(/^ikey_/, "");
  if (
    !Number.isInteger(target) ||
    target < 0 ||
    target > 99 ||
    !/^(?:\d+|[snp]\d*)$/.test(skill)
  )
    return null;
  return { mode: v.mode as Action["mode"], target, skill };
}
export function responseEvidence(body: unknown): boolean {
  return (
    !!body &&
    typeof body === "object" &&
    !("error" in body) &&
    !("reload" in body) &&
    !("login" in body) &&
    ["textlog", "pane_vitals", "pane_monster", "pane_completion"].some(
      (k) => k in body,
    )
  );
}
