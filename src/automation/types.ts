export type Action = {
  mode: "attack" | "magic" | "items" | "spirit" | "defend" | "focus";
  target: number;
  skill: string;
};
export type Candidate = {
  id: string;
  name: string;
  description: string;
  action: Action;
  controlId: string;
  targetId?: string;
  manaCost: number | null;
  charges: number | null;
  cooldownDuration: number | null;
};
export type Effect = { name: string; description: string; remaining: string };
export type Snapshot = {
  revision: string;
  at: string;
  stage: "battle" | "round-end" | "ended" | "challenge" | "outside" | "unknown";
  round: number | null;
  totalRounds: number | null;
  completion: string;
  assets: string[];
  player: {
    hp: number | null;
    mp: number | null;
    sp: number | null;
    spiritStance: boolean;
    chargeSegments: number | null;
    effects: Effect[];
  };
  monsters: {
    id: string;
    name: string;
    healthBarPixels: number | null;
    effects: Effect[];
    targetable: boolean;
  }[];
  items: { slot: string; name: string; available: boolean }[];
  candidates: Candidate[];
  log: string[];
  issues: string[];
};
export type Preference = {
  id: string;
  condition: string;
  preference: string;
  evidence: string[];
  counterEvidence: string[];
  status: "proposed" | "confirmed" | "rejected";
};
export type PreferenceVersion = {
  id: string;
  at: string;
  sourceSessions: string[];
  preferences: Preference[];
};
export type Profile = { id: string; name: string; configuration: string };
export type Session = {
  id: string;
  tabId: number;
  pageId: string;
  at: string;
  updatedAt: string;
  mode: "record" | "auto" | "paused" | "ended";
  purpose?: "play" | "diagnostic";
  confirmedActions?: number;
  seq: number;
  profile: Profile;
  preferences: PreferenceVersion | null;
  pending: string | null;
  last: Snapshot;
  advanceFrom: number | null;
  reason: string | null;
};
export type TraceEvent = {
  id: string;
  sessionId: string;
  seq: number;
  at: string;
  kind: string;
  data: unknown;
};
export type Usage = {
  id: string;
  at: string;
  purpose: "decision" | "summary" | "evaluation";
  model: string;
  input: number | null;
  output: number | null;
  usd: number | null;
  pricesPerMillion?: [number | null, number | null];
  endpoint?: string;
  costSource?: "provider" | "estimate" | "unknown";
  status: "pending" | "reported" | "unknown";
};
export type Settings = {
  jevProvider: "typesafe" | "vercel";
  jevKey: string;
  jevModel: string;
  summaryKey: string;
  summaryEndpoint: string;
  summaryModel: string;
  summaryInputPrice: number | null;
  summaryOutputPrice: number | null;
};
export const DEFAULT_SETTINGS: Settings = {
  jevProvider: "typesafe",
  jevKey: "",
  jevModel: "jev-1.13.0",
  summaryKey: "",
  summaryEndpoint:
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  summaryModel: "qwen-plus",
  summaryInputPrice: null,
  summaryOutputPrice: null,
};
export type Decision = {
  candidateId: string;
  model: string;
  confidence: number | null;
  probabilities: Record<string, number>;
  usageId: string;
};
export type ReplayReport = {
  id: string;
  at: string;
  sessionId: string;
  preferenceVersionId: string;
  status: "running" | "complete" | "interrupted";
  cases: {
    evidence: string;
    before: Snapshot;
    human: string;
    baseline: Decision;
    personalized: Decision;
  }[];
};
export const now = () => new Date().toISOString();
export const uid = () => crypto.randomUUID();
export const actionKey = (a: Action) => `${a.mode}:${a.target}:${a.skill}`;
