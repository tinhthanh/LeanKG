#!/usr/bin/env node
/**
 * Stop hook for LeanKG (summarize)
 * Captures session summary and stores for future context injection
 * Replaces what Claude-Mem's summarize handler does
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;
const SESSION_DIR = join(process.env.HOME || "~", ".cache", "leankg-hooks", "sessions");

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.on("readable", () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

// Extract tool usage from session
function extractToolUsage(input) {
  const tools = [];

  // Check various input formats for tool usage
  if (input.tool_calls) {
    for (const call of input.tool_calls) {
      tools.push({
        name: call.name || call.tool_name || "unknown",
        args: call.arguments || call.args || {},
      });
    }
  }

  if (input.tools_used) {
    tools.push(...input.tools_used);
  }

  if (input.mcp_tools) {
    tools.push(...input.mcp_tools.map(t => ({ name: t })));
  }

  return tools;
}

// Generate session summary
function generateSummary(input) {
  const timestamp = new Date().toISOString();
  const cwd = input.cwd || process.cwd() || "unknown";
  const tools = extractToolUsage(input);

  // Categorize tools used
  const mcpTools = tools.filter(t => t.name.startsWith("mcp__leankg__")).map(t => t.name.replace("mcp__leankg__", ""));
  const bashCommands = tools.filter(t => t.name === "Bash").length;
  const otherTools = tools.filter(t => !t.name.startsWith("mcp__leankg__") && t.name !== "Bash");

  const summary = {
    timestamp,
    cwd,
    tools_used: {
      total: tools.length,
      mcp_leankg: mcpTools.length,
      bash_commands: bashCommands,
      other: otherTools.length,
    },
    leankg_tools: [...new Set(mcpTools)], // unique
    session_duration_ms: input.duration_ms || 0,
  };

  return summary;
}

// Save session summary to file
function saveSessionSummary(summary) {
  try {
    // Ensure directory exists
    if (!existsSync(SESSION_DIR)) {
      mkdirSync(SESSION_DIR, { recursive: true });
    }

    // Use timestamp as filename component
    const ts = new Date().getTime();
    const filename = `session-${ts}.json`;
    const filepath = join(SESSION_DIR, filename);

    writeFileSync(filepath, JSON.stringify(summary, null, 2));

    // Also update a "latest" symlink/reference
    const latestPath = join(SESSION_DIR, "latest.json");
    writeFileSync(latestPath, JSON.stringify(summary, null, 2));

    return filepath;
  } catch (err) {
    console.error("Failed to save session summary:", err.message);
    return null;
  }
}

// Build output for stop hook
function buildStopOutput(summary) {
  const toolList = summary.leankg_tools.length > 0
    ? `\n\nLeanKG tools used this session:\n${summary.leankg_tools.map(t => `  - ${t}`).join("\n")}`
    : "";

  return `Session Summary:
- Working directory: ${summary.cwd}
- Total tools used: ${summary.tools_used.total}
- LeanKG MCP calls: ${summary.tools_used.mcp_leankg}
- Bash commands: ${summary.tools_used.bash_commands}${toolList}

This summary will be available for context injection in future sessions.`;
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw.trim()) process.exit(0);

    const input = JSON.parse(raw);

    // This hook activates on Stop
    const hookName = input.hook_name || input.hook_event_name || "";
    if (hookName !== "Stop") {
      process.exit(0);
    }

    const summary = generateSummary(input);
    const savedPath = saveSessionSummary(summary);

    const summaryText = buildStopOutput(summary);

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "Stop",
        sessionSummary: summary,
        summaryText,
        savedTo: savedPath,
      },
    }) + "\n");

  } catch (err) {
    console.error("Summarize error:", err.message);
    process.exit(0);
  }
}

main();