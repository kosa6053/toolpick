import { describe, it, expect, afterAll } from "bun:test";
import { fileCache } from "../cache";
import { createPrepareStep } from "../integrations/prepare-step";
import { createToolIndex } from "../tool-index";
import { HybridSearch } from "../search/hybrid";
import type { ToolDescription } from "../search/types";
import { tool, jsonSchema } from "ai";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const TOOLS: ToolDescription[] = [
  { name: "deployApp", text: "Deploy the application to production" },
  { name: "sendSlack", text: "Send a message to Slack" },
  { name: "queryDB", text: "Query the database" },
  { name: "sendEmail", text: "Send an email" },
  { name: "createIssue", text: "Create a new issue" },
];

describe("fileCache", () => {
  const cachePath = join(tmpdir(), `toolpick-test-${Date.now()}.json`);

  afterAll(async () => {
    await rm(cachePath, { force: true });
  });

  it("load returns null when file does not exist", async () => {
    const cache = fileCache(cachePath);
    const result = await cache.load();
    expect(result).toBeNull();
  });

  it("save then load round-trips embeddings", async () => {
    const cache = fileCache(cachePath);
    const embeddings = [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]];
    await cache.save(embeddings);
    const loaded = await cache.load();
    expect(loaded).toEqual(embeddings);
  });

  it("load returns null for invalid JSON", async () => {
    const badPath = join(tmpdir(), `toolpick-bad-${Date.now()}.json`);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(badPath, "not json", "utf-8");
    const cache = fileCache(badPath);
    const result = await cache.load();
    expect(result).toBeNull();
    await rm(badPath, { force: true });
  });
});

describe("prepareStep escalation", () => {
  const engine = new HybridSearch(TOOLS);
  const toolNames = TOOLS.map(t => t.name);

  it("normal step returns limited tools", async () => {
    const fn = createPrepareStep(engine, toolNames, { maxTools: 2 });

    const result = await fn({
      messages: [{ role: "user" as const, content: "deploy the app" }],
      steps: [],
      stepNumber: 0,
    } as any);

    expect(result?.activeTools?.length).toBeLessThanOrEqual(2);
  });

  it("shifts to next page of tools after one failed step", async () => {
    const fn = createPrepareStep(engine, toolNames, { maxTools: 2 });

    const failedStep = {
      toolCalls: [],
      toolResults: [],
      text: "",
      finishReason: "stop",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      warnings: [],
      request: {},
      response: { messages: [] },
    };

    const firstPage = await fn({
      messages: [{ role: "user" as const, content: "send a message or email" }],
      steps: [],
      stepNumber: 0,
    } as any);

    const secondPage = await fn({
      messages: [{ role: "user" as const, content: "send a message or email" }],
      steps: [failedStep],
      stepNumber: 1,
    } as any);

    const firstSet = new Set(firstPage!.activeTools!);
    const secondSet = new Set(secondPage!.activeTools!);
    const overlap = [...secondSet].filter(t => firstSet.has(t));
    expect(overlap.length).toBeLessThan(firstSet.size);
  });

  it("returns all tools after two consecutive failed steps", async () => {
    const fn = createPrepareStep(engine, toolNames, { maxTools: 2 });

    const failedStep = {
      toolCalls: [],
      toolResults: [],
      text: "",
      finishReason: "stop",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      warnings: [],
      request: {},
      response: { messages: [] },
    };

    const result = await fn({
      messages: [{ role: "user" as const, content: "deploy the app" }],
      steps: [failedStep, failedStep],
      stepNumber: 2,
    } as any);

    expect(result?.activeTools).toEqual(expect.arrayContaining(toolNames));
    expect(result?.activeTools?.length).toBe(toolNames.length);
  });

  it("resets after a successful step", async () => {
    const fn = createPrepareStep(engine, toolNames, { maxTools: 2 });

    const successStep = {
      toolCalls: [{ toolName: "deployApp", toolCallId: "1", args: {} }],
      toolResults: [],
      text: "",
      finishReason: "tool-calls",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      warnings: [],
      request: {},
      response: { messages: [] },
    };

    const result = await fn({
      messages: [{ role: "user" as const, content: "now send a slack message" }],
      steps: [successStep],
      stepNumber: 1,
    } as any);

    expect(result?.activeTools?.length).toBeLessThanOrEqual(2);
  });

  it("includes relatedTools companions", async () => {
    const fn = createPrepareStep(engine, toolNames, { maxTools: 2 }, {
      deployApp: ["queryDB"],
    });

    const result = await fn({
      messages: [{ role: "user" as const, content: "deploy the app" }],
      steps: [],
      stepNumber: 0,
    } as any);

    expect(result?.activeTools).toContain("deployApp");
    expect(result?.activeTools).toContain("queryDB");
  });
});

describe("relatedTools via createToolIndex integrations", () => {
  const indexTools = {
    deployApp: tool({
      description: "Deploy the application to production",
      inputSchema: jsonSchema<{ branch: string }>({
        type: "object",
        properties: { branch: { type: "string" } },
        required: ["branch"],
      }),
      execute: async () => ({ url: "" }),
    }),
    sendSlack: tool({
      description: "Send a message to Slack channel",
      inputSchema: jsonSchema<{ text: string }>({
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      }),
      execute: async () => ({ ok: true }),
    }),
    queryDB: tool({
      description: "Query the PostgreSQL database",
      inputSchema: jsonSchema<{ sql: string }>({
        type: "object",
        properties: { sql: { type: "string" } },
        required: ["sql"],
      }),
      execute: async () => ({ rows: [] }),
    }),
    sendEmail: tool({
      description: "Send an email to a recipient",
      inputSchema: jsonSchema<{ to: string }>({
        type: "object",
        properties: { to: { type: "string" } },
        required: ["to"],
      }),
      execute: async () => ({ sent: true }),
    }),
  };

  it("prepareStep propagates index-level relatedTools", async () => {
    const idx = createToolIndex(indexTools, {
      relatedTools: { deployApp: ["queryDB"] },
    });
    const fn = idx.prepareStep({ maxTools: 2 });

    const result = await fn({
      messages: [{ role: "user" as const, content: "deploy the app to production" }],
      steps: [],
      stepNumber: 0,
    } as any);

    expect(result?.activeTools).toContain("deployApp");
    expect(result?.activeTools).toContain("queryDB");
  });

  it("prepareStep per-call relatedTools overrides index-level", async () => {
    const idx = createToolIndex(indexTools, {
      relatedTools: { deployApp: ["queryDB"] },
    });
    const fn = idx.prepareStep({
      maxTools: 2,
      relatedTools: { deployApp: ["sendSlack"] },
    });

    const result = await fn({
      messages: [{ role: "user" as const, content: "deploy the app to production" }],
      steps: [],
      stepNumber: 0,
    } as any);

    expect(result?.activeTools).toContain("deployApp");
    expect(result?.activeTools).toContain("sendSlack");
    expect(result?.activeTools).not.toContain("queryDB");
  });

  it("middleware propagates index-level relatedTools", async () => {
    const idx = createToolIndex(indexTools, {
      relatedTools: { deployApp: ["queryDB"] },
    });
    const mw = idx.middleware({ maxTools: 2 });

    const params = {
      prompt: [{ role: "user", content: "deploy the app to production" }],
      tools: Object.keys(indexTools).map((name) => ({ name, type: "function" })),
    };

    const result = await mw.transformParams!({ params } as any);
    const names = result.tools!.map((t: any) => t.name);
    expect(names).toContain("deployApp");
    expect(names).toContain("queryDB");
  });

  it("middleware per-call relatedTools: {} disables expansion", async () => {
    const idx = createToolIndex(indexTools, {
      relatedTools: { deployApp: ["queryDB"] },
    });
    const mw = idx.middleware({ maxTools: 2, relatedTools: {} });

    const params = {
      prompt: [{ role: "user", content: "deploy the app to production" }],
      tools: Object.keys(indexTools).map((name) => ({ name, type: "function" })),
    };

    const result = await mw.transformParams!({ params } as any);
    const names = result.tools!.map((t: any) => t.name);
    expect(names).toContain("deployApp");
    expect(names).not.toContain("queryDB");
  });
});
