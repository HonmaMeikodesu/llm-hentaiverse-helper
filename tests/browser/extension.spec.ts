import { test, expect, chromium, BrowserContext, Page } from "@playwright/test";
import { createServer, Server } from "node:http";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { parseHTML } from "linkedom";

let server: Server,
  context: BrowserContext,
  directory: string,
  extensionId: string;
let actions = 0,
  invalidResponse = false,
  holdResponse = false,
  roundPage = false,
  completeRound = false;
const fixture = readFileSync("docs/research/startBattle.html", "utf8")
  .replace(/<link[^>]+>/g, "")
  .replace('src="./hvc.js"', 'src="/hvc.js"')
  .replace("https://hentaiverse.org/", "http://127.0.0.1:7001/")
  .replace(/<script[^>]+src="\/dynjs[^>]+><\/script>/g, "")
  .replace(
    "</head>",
    "<style>body{font:14px sans-serif}#mainpane{width:850px}#battle_right{position:absolute;left:600px;top:25px}.btm1{padding:12px;border:1px solid #aaa;width:190px}.btm2 img,.chbd img{height:12px}.btsd{padding:5px}.bti1{min-height:22px}#pane_action img{width:32px;height:22px}#textlog{max-width:580px}</style></head>",
  );
const after = parseHTML(
  readFileSync("docs/research/nextTurnBattle.html", "utf8"),
).document;
const update = Object.fromEntries(
  [
    "pane_effects",
    "pane_action",
    "pane_vitals",
    "pane_quickbar",
    "table_skills",
    "table_magic",
    "pane_item",
    "pane_monster",
  ].map((id) => [id, after.getElementById(id)?.innerHTML || ""]),
);
async function rpc(page: Page, type: string, payload: unknown = {}) {
  return page.evaluate(
    async ({ type, payload }) => {
      const r = await (globalThis as any).chrome.runtime.sendMessage({
        scope: "hv-helper",
        type,
        payload,
      });
      if (!r.ok) throw new Error(r.error);
      return r.value;
    },
    { type, payload },
  );
}
test.beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === "/hvc.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(readFileSync("docs/research/hvc.js"));
      return;
    }
    if (req.url === "/json") {
      let body = "";
      req.on("data", (b) => (body += b));
      req.on("end", () => {
        actions++;
        if (holdResponse) return;
        res.setHeader("Content-Type", "application/json");
        if (invalidResponse) {
          res.statusCode = 500;
          res.end("{}");
          return;
        }
        const data = JSON.parse(body);
        const completion = completeRound
          ? {
              pane_monster: "You are victorious",
              pane_completion:
                '<button id="btcp" onclick="battle.battle_continue()">Continue</button>',
            }
          : {};
        if (completeRound) {
          roundPage = true;
          completeRound = false;
        }
        res.end(
          JSON.stringify({
            ...update,
            ...completion,
            textlog: [{ t: `Action ${actions}: ${data.mode} completed.` }],
            exp: 100,
            healthflash: false,
          }),
        );
      });
      return;
    }
    if (req.url === "/" || req.url === "/round") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        roundPage ? fixture.replace("Round 1 / 12", "Round 2 / 12") : fixture,
      );
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((r) => server.listen(7001, "127.0.0.1", r));
  directory = mkdtempSync(resolve(tmpdir(), "hv-extension-"));
  context = await chromium.launchPersistentContext(directory, {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${process.cwd()}`,
      `--load-extension=${process.cwd()}`,
      "--no-sandbox",
    ],
    viewport: { width: 1280, height: 900 },
  });
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  extensionId = new URL(worker.url()).host;
});
test.afterAll(async () => {
  await context?.close();
  server?.closeAllConnections();
  await new Promise<void>((r) => server?.close(() => r()));
  if (directory) rmSync(directory, { recursive: true, force: true });
});

test("real extension records clicks and keyboard actions, reviews a cited preference, and takes over with Jev", async () => {
  const options = await context.newPage();
  await options.goto(
    `chrome-extension://${extensionId}/extension/options.html`,
  );
  await expect(
    options.getByRole("heading", { name: "让决策理解你的取舍" }),
  ).toBeVisible();
  await options
    .getByRole("button", { name: "使用 Vercel 配置两个模型" })
    .click();
  await expect(options.locator("#jev-provider")).toHaveValue("vercel");
  await expect(options.locator("#jev-model")).toHaveValue("typesafe-ai/jev");
  await expect(options.locator("#summary-endpoint")).toHaveValue(
    "https://ai-gateway.vercel.sh/v1/chat/completions",
  );
  await options.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(options.locator("#jev-provider")).toHaveValue("typesafe");
  const status = await rpc(options, "status");
  await rpc(options, "save-settings", {
    settings: {
      ...status.settings,
      jevKey: "test-key",
      summaryKey: "test-key",
      summaryEndpoint: "https://api.typesafe.ai/test-summary",
      summaryModel: "test-summary",
      summaryInputPrice: 0,
      summaryOutputPrice: 0,
    },
    profile: status.profile,
  });
  let modelCalls = 0;
  await context.route("https://api.typesafe.ai/**", async (route) => {
    const body = route.request().postDataJSON();
    if (route.request().url().endsWith("test-summary")) {
      const evidence = JSON.parse(body.messages[1].content).examples[0]
        .evidence;
      await route.fulfill({
        json: {
          model: "test-summary",
          usage: { prompt_tokens: 100, completion_tokens: 60 },
          choices: [
            {
              message: {
                content: JSON.stringify({
                  preferences: [
                    {
                      condition: "当前示例局面",
                      preference: "倾向继续进攻",
                      evidence: [evidence],
                      counterEvidence: [],
                    },
                  ],
                }),
              },
            },
          ],
        },
      });
    } else {
      modelCalls++;
      const choice = Object.keys(body.questions.action.criteria).find((k) =>
        k.startsWith("attack:"),
      );
      await route.fulfill({
        json: {
          model: "jev-test",
          answers: {
            action: {
              type: "choice",
              choice,
              confidence: 0.6,
              probabilities: { [choice!]: 1 },
            },
          },
          usage: { input_tokens: 200_000_000, output_tokens: 0 },
        },
      });
    }
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:7001/");
  await page
    .getByRole("button", { name: "录制 / 恢复录制", exact: true })
    .click();
  await expect(
    page.getByText("正在录制你的游玩", { exact: true }),
  ).toBeVisible();
  await page.locator("#mkey_1").click();
  await expect.poll(() => actions).toBe(1);
  await page.keyboard.press("2");
  await expect.poll(() => actions).toBe(2);
  await expect
    .poll(async () => {
      const data = await rpc(options, "export");
      return data.events.filter((e: any) => e.kind === "result" && e.data.ok)
        .length;
    })
    .toBe(2);
  await page.getByRole("button", { name: "结束本场记录", exact: true }).click();
  await options.getByRole("button", { name: "刷新", exact: true }).click();
  await options.locator('input[name="session"]').first().check();
  await options.getByRole("button", { name: "从所选示范归纳偏好" }).click();
  await expect(options.getByText("归纳完成，请审阅并确认。")).toBeVisible();
  await options.locator('#preferences input[type="checkbox"]').check();
  await options.getByRole("button", { name: "保存本批审阅结果" }).click();
  await expect(
    options.getByText("审阅结果已保存，将用于后续新开的接管会话。"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "接管 / 恢复接管", exact: true })
    .click();
  await expect.poll(() => modelCalls).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await expect(page.getByText("已暂停", { exact: true })).toBeVisible();
  const data = await rpc(options, "export");
  expect(
    data.events.filter(
      (e: any) => e.kind === "request" && e.data.source === "human",
    ),
  ).toHaveLength(2);
  expect(
    data.events.some(
      (e: any) => e.kind === "request" && e.data.source === "jev",
    ),
  ).toBeTruthy();
  expect(
    data.usage
      .filter((u: any) => u.purpose === "decision")
      .reduce((s: number, u: any) => s + u.usd, 0),
  ).toBeGreaterThan(5);
  expect(JSON.stringify(data)).not.toContain("test-key");
  expect(JSON.stringify(data)).not.toContain("battle_token");
  await page.getByRole("button", { name: "结束本场记录", exact: true }).click();
  await options.getByRole("button", { name: "刷新", exact: true }).click();
  await options.screenshot({
    path: "test-results/options.png",
    fullPage: true,
  });
  await page.screenshot({ path: "test-results/battle-panel.png" });
  await page.close();
  await options.close();
});

test("refresh during an unresolved action preserves it and never replays automatically", async () => {
  const options = await context.newPage();
  await options.goto(
    `chrome-extension://${extensionId}/extension/options.html`,
  );
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:7001/");
  await page
    .getByRole("button", { name: "录制 / 恢复录制", exact: true })
    .click();
  holdResponse = true;
  const before = actions;
  await page.locator("#mkey_1").click();
  await expect.poll(() => actions).toBe(before + 1);
  await expect
    .poll(async () => (await rpc(options, "status")).sessions[0].pending)
    .not.toBeNull();
  await page.reload();
  await expect(page.getByText("已暂停", { exact: true })).toBeVisible();
  const data = await rpc(options, "export");
  expect(
    data.events.some(
      (e: any) => e.kind === "interruption" && e.data.unresolvedAction,
    ),
  ).toBeTruthy();
  expect(actions).toBe(before + 1);
  holdResponse = false;
  await page.getByRole("button", { name: "结束本场记录", exact: true }).click();
  await page.close();
  await options.close();
});

test("a recorded next-round transition survives real navigation and resumes the same demonstration", async () => {
  roundPage = false;
  const options = await context.newPage();
  await options.goto(
    `chrome-extension://${extensionId}/extension/options.html`,
  );
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:7001/");
  await page
    .getByRole("button", { name: "录制 / 恢复录制", exact: true })
    .click();
  const id = (await rpc(options, "status")).sessions[0].id;
  completeRound = true;
  await page.locator("#mkey_1").click();
  await expect
    .poll(
      async () =>
        (await rpc(options, "events", { sessionId: id })).filter(
          (e: any) => e.kind === "result" && e.data.ok,
        ).length,
    )
    .toBe(1);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("正在录制你的游玩", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      (await rpc(options, "events", { sessionId: id })).some(
        (e: any) => e.kind === "round-arrived",
      ),
    )
    .toBeTruthy();
  expect((await rpc(options, "status")).sessions[0].last.round).toBe(2);
  await page.getByRole("button", { name: "结束本场记录", exact: true }).click();
  await expect
    .poll(async () => (await rpc(options, "status")).sessions[0].mode)
    .toBe("ended");
  const actionCount = actions;
  const report = await rpc(options, "replay", { sessionId: id });
  expect(report.status).toBe("complete");
  expect(report.cases).toHaveLength(1);
  expect(actions).toBe(actionCount);
  await options.getByRole("button", { name: "刷新", exact: true }).click();
  await expect(
    options.getByText("未个性化建议：", { exact: false }),
  ).toBeVisible();
  expect((await rpc(options, "export")).replays).toHaveLength(1);
  await page.close();
  await options.close();
  roundPage = false;
});

test("unpersonalized diagnostic stops after five confirmations and cannot train preferences", async () => {
  const options = await context.newPage();
  await options.goto(
    `chrome-extension://${extensionId}/extension/options.html`,
  );
  let calls = 0;
  await context.route("https://api.typesafe.ai/v1/systemone", async (route) => {
    calls++;
    const body = route.request().postDataJSON();
    expect(body.state.preferences).toEqual([]);
    expect(body.state.examples).toEqual([]);
    const choice = Object.keys(body.questions.action.criteria).find((k) =>
      k.startsWith("attack:"),
    )!;
    await route.fulfill({
      json: {
        model: "jev-test",
        answers: {
          action: {
            type: "choice",
            choice,
            confidence: 0.5,
            probabilities: { [choice]: 1 },
          },
        },
        usage: { input_tokens: 100, output_tokens: 0 },
      },
    });
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:7001/");
  const before = actions;
  await page
    .getByRole("button", { name: "无偏好测试（最多5步）", exact: true })
    .click();
  await expect(page.getByText(/无偏好测试已完成 5 个确认动作/)).toBeVisible({
    timeout: 15000,
  });
  expect(actions - before).toBe(5);
  expect(calls).toBe(5);
  const session = (await rpc(options, "status")).sessions[0];
  expect(session.purpose).toBe("diagnostic");
  expect(session.preferences).toBeNull();
  expect(session.confirmedActions).toBe(5);
  await page
    .getByRole("button", { name: "无偏好测试（最多5步）", exact: true })
    .click();
  await expect(page.getByText(/无偏好测试已完成 5 个确认动作/)).toBeVisible();
  expect(calls).toBe(5);
  await page.getByRole("button", { name: "结束本场记录", exact: true }).click();
  await expect
    .poll(async () => (await rpc(options, "status")).sessions[0].mode)
    .toBe("ended");
  await expect(
    rpc(options, "summarize", { sessionIds: [session.id] }),
  ).rejects.toThrow();
  await expect(
    rpc(options, "replay", { sessionId: session.id }),
  ).rejects.toThrow();
  await page.close();
  await options.close();
});
