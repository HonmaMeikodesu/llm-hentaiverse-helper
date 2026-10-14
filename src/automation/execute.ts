import { Candidate } from "./types.js";
import { enabled } from "./observe.js";

export function execute(doc: Document, candidate: Candidate) {
  const control = doc.getElementById(candidate.controlId);
  const target = candidate.targetId
    ? doc.getElementById(candidate.targetId)
    : null;
  if (!enabled(control) || (candidate.targetId && !enabled(target)))
    throw new Error("Action controls are no longer available");
  // Use real DOM clicks, never execute model-generated JS or reconstruct game requests.
  // Normal attack may already be selected. Clicking it again toggles the game mode.
  if (candidate.action.mode === "attack") {
    if (!/attack_s\.png/.test(control.getAttribute("src") || ""))
      control.click();
    target!.click();
  } else {
    if (
      candidate.action.mode === "magic" ||
      candidate.action.mode === "items"
    ) {
      // Clear a manually preselected spell without casting it, before selecting ours.
      const reset = doc.querySelector<HTMLElement>(
        '#pane_skill [onclick*="reset_skill()"], #pane_magic [onclick*="reset_skill()"]',
      );
      if (!reset)
        throw new Error("Cannot safely reset a prior spell selection");
      reset.click();
    }
    control.click();
    if (target) target.click();
  }
}
export function advanceRound(doc: Document) {
  const control = doc.getElementById("btcp");
  if (
    !enabled(control) ||
    !/battle_continue/.test(control.getAttribute("onclick") || "")
  )
    throw new Error("Next-round control not verified");
  control.click();
}
