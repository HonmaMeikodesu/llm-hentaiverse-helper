import { Settings } from "./types.js";

export function jevConnection(
  settings: Pick<Settings, "jevProvider" | "jevModel">,
) {
  if (settings.jevProvider === "vercel") {
    return {
      endpoint: "https://ai-gateway.vercel.sh/typesafe/v1/systemone",
      prices: [null, null] as [number | null, number | null],
    };
  }
  if (settings.jevProvider !== "typesafe") throw new Error("未知的 Jev 服务商");
  return {
    endpoint: "https://api.typesafe.ai/v1/systemone",
    prices: [settings.jevModel === "jev-1.13.0" ? 0.042 : null, 0] as [
      number | null,
      number | null,
    ],
  };
}
