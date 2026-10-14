import {
  Action,
  Candidate,
  Effect,
  Snapshot,
  actionKey,
  now,
} from "./types.js";

const text = (el: Element | null) =>
  (el?.textContent || "").replace(/\s+/g, " ").trim();
const number = (value: string | null | undefined) =>
  value != null && /^\d+(?:\.\d+)?$/.test(value.replace(/,/g, "").trim())
    ? Number(value.replace(/,/g, "").trim())
    : null;
// Parse only literal tooltip arguments. Never evaluate page JavaScript.
export function literals(handler: string): (string | number)[] {
  const body = handler.slice(
    handler.indexOf("(") + 1,
    handler.lastIndexOf(")"),
  );
  const tokens =
    body.match(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?/g) || [];
  return tokens.map((t) =>
    /^['"]/.test(t) ? t.slice(1, -1).replace(/\\(['"\\])/g, "$1") : Number(t),
  );
}
function effects(root: Element | null): Effect[] {
  return Array.from(
    root?.querySelectorAll('[onmouseover*="set_infopane_effect"]') || [],
  ).map((e) => {
    const a = literals(e.getAttribute("onmouseover") || "");
    return {
      name: String(a[0] ?? ""),
      description: String(a[1] ?? ""),
      remaining: String(a[2] ?? "unknown"),
    };
  });
}
export function enabled(el: Element | null): el is HTMLElement {
  return (
    !!el &&
    !!el.getAttribute("onclick") &&
    !el.hasAttribute("disabled") &&
    el.getAttribute("aria-disabled") !== "true" &&
    (el as HTMLElement).style.opacity !== "0.5"
  );
}
export function fingerprint(value: unknown): string {
  let h = 14695981039346656037n;
  for (const c of JSON.stringify(value))
    h = BigInt.asUintN(64, (h ^ BigInt(c.charCodeAt(0))) * 1099511628211n);
  return h.toString(16);
}
export function observe(
  doc: Document,
  context?: Pick<Snapshot, "round" | "totalRounds">,
): Snapshot {
  const q = (s: string) => doc.querySelector(s);
  const issues: string[] = [];
  const completion =
    text(q("#pane_completion")) +
    " " +
    (q('#pane_monster [id^="mkey_"]') ? "" : text(q("#pane_monster")));
  const log = Array.from(doc.querySelectorAll("#textlog tr"))
    .map(text)
    .filter(Boolean);
  const roundMatch =
    log.join("\n").match(/Round\s+(\d+)\s*\/\s*(\d+)/i) ||
    completion.match(/Round\s+(\d+)\s*\/\s*(\d+)/i);
  const round = roundMatch ? Number(roundMatch[1]) : (context?.round ?? null);
  const totalRounds = roundMatch
    ? Number(roundMatch[2])
    : (context?.totalRounds ?? null);
  const monsters = Array.from(
    doc.querySelectorAll('#pane_monster [id^="mkey_"]'),
  ).map((el) => ({
    id: el.id,
    name: text(el.querySelector(".btm3")),
    targetable: enabled(el),
    healthBarPixels: number(
      (
        el.querySelector('img[alt="health"]') as HTMLElement | null
      )?.style.width.replace("px", ""),
    ),
    effects: effects(el.querySelector(".btm6")),
  }));
  const player = {
    hp: number(text(q("#vrhb") || q("#vrh"))),
    mp: number(text(q("#vrm"))),
    sp: number(text(q("#vrs"))),
    spiritStance: /spirit_a/.test(q("#ckey_spirit")?.getAttribute("src") || ""),
    chargeSegments: q("#vcp > div") ? q("#vcp > div")!.children.length : null,
    effects: effects(q("#pane_effects")),
  };
  let stage: Snapshot["stage"] = "outside";
  if (q("#riddlemaster")) stage = "challenge";
  else if (q("#pane_monster")) {
    if (
      /defeated|run away|challenge cleared/i.test(completion) ||
      /goto_(?:arena|ring|grindfest|itemworld)/.test(
        q("#btcp")?.getAttribute("onclick") || "",
      )
    )
      stage = "ended";
    else if (monsters.some((m) => m.targetable)) stage = "battle";
    else if (
      /battle_continue/.test(q("#btcp")?.getAttribute("onclick") || "") &&
      round !== null &&
      totalRounds !== null &&
      round < totalRounds
    )
      stage = "round-end";
    else if (
      /victorious/i.test(completion) &&
      round !== null &&
      round === totalRounds
    )
      stage = "ended";
    else stage = "unknown";
  }
  const candidates: Candidate[] = [];
  const add = (
    el: Element,
    name: string,
    description: string,
    mode: Action["mode"],
    hostile: boolean,
    skill = "0",
    manaCost: number | null = 0,
    charges: number | null = 0,
    cooldownDuration: number | null = 0,
  ) => {
    if (!enabled(el) || stage !== "battle") return;
    if (manaCost !== null && player.mp !== null && manaCost > player.mp) return;
    const targets = hostile
      ? monsters.filter((m) => m.targetable).map((m) => m.id)
      : [undefined];
    for (const targetId of targets) {
      const action: Action = {
        mode,
        target: targetId ? Number(targetId.slice(5)) : 0,
        skill,
      };
      candidates.push({
        id: actionKey(action),
        name,
        description,
        action,
        controlId: el.id,
        targetId,
        manaCost,
        charges,
        cooldownDuration,
      });
    }
  };
  const basics = [
    [
      "attack",
      "Attack",
      "Normal weapon attack on the selected enemy. Weapon effects may affect other enemies.",
    ],
    ["defend", "Defend", "Increase defensive capabilities for the next turn."],
    [
      "focus",
      "Focus",
      "Prepare spellcasting; defenses are reduced. Exact resource recovery is not verified.",
    ],
    [
      "spirit",
      player.spiritStance ? "Disable Spirit Stance" : "Enable Spirit Stance",
      "Toggle the currently observed spirit stance.",
    ],
  ];
  for (const [mode, name, desc] of basics) {
    const el = doc.getElementById(`ckey_${mode}`);
    if (el) add(el, name, desc, mode as Action["mode"], mode === "attack");
  }
  for (const el of doc.querySelectorAll(
    '#pane_skill [id][onmouseover*="set_infopane_spell"], #pane_magic [id][onmouseover*="set_infopane_spell"]',
  )) {
    const a = literals(el.getAttribute("onmouseover") || "");
    const handler = el.getAttribute("onclick") || "";
    if (!/^\d+$/.test(el.id) || !enabled(el)) continue;
    const hostile = /set_hostile_skill\(/.test(handler),
      friendly = /set_friendly_skill\(/.test(handler);
    if (!hostile && !friendly) {
      issues.push(`Unknown targeting for ${el.id}`);
      continue;
    }
    add(
      el,
      String(a[0] ?? text(el)),
      String(a[1] ?? ""),
      "magic",
      hostile,
      el.id,
      typeof a[3] === "number" ? a[3] : null,
      typeof a[4] === "number" ? a[4] : null,
      typeof a[5] === "number" ? a[5] : null,
    );
  }
  const items = Array.from(doc.querySelectorAll("#pane_item .bti1")).map(
    (el) => ({
      slot: text(el.querySelector(".bti2")),
      name: text(el.querySelector(".bti3")),
      available: enabled(el.querySelector('[id^="ikey_"]')),
    }),
  );
  for (const el of doc.querySelectorAll('#pane_item [id^="ikey_"]'))
    add(
      el,
      text(el),
      "Use the item currently equipped in this slot. Exact effects depend on item and abilities.",
      "items",
      false,
      el.id.slice(5),
      null,
      null,
      null,
    );
  if (stage === "battle") {
    if (player.hp === null || player.mp === null || player.sp === null)
      issues.push("Missing player vitals");
    if (!candidates.length) issues.push("No supported available actions");
    if (candidates.length > 255)
      issues.push("More than 255 candidates; refusing to silently truncate");
    for (const el of doc.querySelectorAll(
      "#pane_skill [onclick], #pane_magic [onclick], #pane_item [onclick]",
    )) {
      if (
        /lock_action/.test(el.getAttribute("onclick") || "") &&
        !candidates.some((c) => c.controlId === el.id) &&
        enabled(el) &&
        !el.getAttribute("onmouseover")?.includes("set_infopane_spell")
      )
        issues.push(`Unrecognized action control ${el.id}`);
    }
  }
  const data = {
    stage,
    round,
    totalRounds,
    completion: completion.trim(),
    assets: Array.from(doc.querySelectorAll('link[rel="stylesheet"]'))
      .map((e) => e.getAttribute("href") || "")
      .filter((s) => /\/z\//.test(s)),
    player,
    monsters,
    items,
    candidates,
    log,
    issues,
  };
  return { ...data, at: now(), revision: fingerprint(data) };
}
