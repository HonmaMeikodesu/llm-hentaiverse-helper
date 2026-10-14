import {
  BRIDGE,
  BridgeMessage,
  readAction,
  responseEvidence,
} from "../automation/protocol.js";
import { Action } from "../automation/types.js";

// Runs in MAIN at document_start. The only data crossing worlds is whitelisted:
// never tokens, headers, request/response bodies, cookies, or arbitrary page scripts.
const send = (message: Omit<BridgeMessage, "channel">) =>
  window.postMessage({ channel: BRIDGE, ...message }, location.origin);
const urls = new WeakMap<XMLHttpRequest, string>();
const originalOpen = XMLHttpRequest.prototype.open;
const originalSend = XMLHttpRequest.prototype.send;
const sameOrigin = (url: string) => {
  try {
    return new URL(url, location.href).origin === location.origin;
  } catch {
    return false;
  }
};
XMLHttpRequest.prototype.open = function (...args: any[]) {
  urls.set(this, String(args[1]));
  return (originalOpen as any).apply(this, args);
};
XMLHttpRequest.prototype.send = function (
  body?: Document | XMLHttpRequestBodyInit | null,
) {
  let action: Action | null = null;
  try {
    if (typeof body === "string" && sameOrigin(urls.get(this) || ""))
      action = readAction(JSON.parse(body));
  } catch {
    /* not a battle request */
  }
  if (action) {
    const requestId = crypto.randomUUID();
    send({ kind: "request", requestId, action });
    this.addEventListener(
      "loadend",
      () => {
        let ok = false;
        try {
          ok =
            this.status === 200 &&
            responseEvidence(
              this.responseType === "json"
                ? this.response
                : JSON.parse(this.responseText),
            );
        } catch {
          /* unknown outcome */
        }
        send({
          kind: "response",
          requestId,
          ok,
          status: this.status,
          reason: ok
            ? undefined
            : "Response could not confirm a completed battle action",
        });
      },
      { once: true },
    );
  }
  return originalSend.call(this, body);
};
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let action: Action | null = null;
  try {
    if (
      typeof init?.body === "string" &&
      sameOrigin(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      )
    )
      action = readAction(JSON.parse(init.body));
  } catch {
    /* not a battle request */
  }
  if (!action) return originalFetch.call(this, input, init);
  const requestId = crypto.randomUUID();
  send({ kind: "request", requestId, action });
  try {
    const response = await originalFetch.call(this, input, init);
    const copy = response.clone();
    void copy.json().then(
      (body) =>
        send({
          kind: "response",
          requestId,
          ok: response.ok && responseEvidence(body),
          status: response.status,
        }),
      () =>
        send({
          kind: "response",
          requestId,
          ok: false,
          status: response.status,
        }),
    );
    return response;
  } catch (error) {
    send({ kind: "response", requestId, ok: false, status: 0 });
    throw error;
  }
};
window.addEventListener("message", (e) => {
  if (
    e.source === window &&
    e.origin === location.origin &&
    e.data?.channel === BRIDGE &&
    e.data?.kind === "ping"
  )
    send({ kind: "ready", requestId: "" });
});
send({ kind: "ready", requestId: "" });
