#!/usr/bin/env node
/**
 * UserPromptSubmit hook for LeanKG (session-init)
 * Initializes session context and injects LeanKG usage patterns
 * Replaces what Claude-Mem's session-init handler does
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname;
const SESSION_STORE = join(process.env.HOME || "~", ".cache", "leankg-hooks", "sessions.db");

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

// Detect project type from directory structure
function detectProjectType(cwd) {
  const indicators = [
    { pattern: "Cargo.toml", type: "rust", weight: 10 },
    { pattern: "package.json", type: "node", weight: 8 },
    { pattern: "go.mod", type: "go", weight: 9 },
    { pattern: "pyproject.toml", type: "python", weight: 7 },
    { pattern: "requirements.txt", type: "python", weight: 6 },
    { pattern: "pom.xml", type: "java", weight: 7 },
    { pattern: "build.gradle", type: "java", weight: 8 },
    { pattern: ".venv", type: "python", weight: 5 },
    { pattern: "node_modules", type: "node", weight: 4 },
    { pattern: "src/main.rs", type: "rust", weight: 6 },
    { pattern: "src/lib.rs", type: "rust", weight: 6 },
  ];

  let bestType = "unknown";
  let bestScore = 0;

  for (const { pattern, type, weight } of indicators) {
    if (existsSync(join(cwd, pattern))) {
      if (weight > bestScore) {
        bestScore = weight;
        bestType = type;
      }
    }
  }

  return bestType;
}

// Get LeanKG tool routing based on project type
function getToolRouting(projectType) {
  const baseRouting = `
<tool_selection_hierarchy>
  1. ORCHESTRATE: mcp__leankg__orchestrate(intent)
     - Natural language: "show me impact of changing function X"

  2. CODE DISCOVERY: mcp__leankg__search_code(query, element_type)
     - Primary search. ONE call replaces many Grep/Bash commands.

  3. IMPACT ANALYSIS: mcp__leankg__get_impact_radius(file, depth)
     - Calculate blast radius BEFORE making changes.

  4. CONTEXT: mcp__leankg__get_context(file)
     - Get minimal token-optimized context for a file.

  5. DEPENDENCIES: mcp__leankg__get_dependencies(file) | mcp__leankg__get_dependents(file)

  6. CALLERS: mcp__leankg__get_callers(function) | mcp__leankg__find_function(name)

  7. DOCUMENTATION: mcp__leankg__get_doc_for_file(file) | mcp__leankg__get_traceability(element)

  8. TESTING: mcp__leankg__get_tested_by(file) | mcp__leankg__detect_changes(scope)
</tool_selection_hierarchy>`;

  const projectSpecific = projectType !== "unknown" ? `\n<project_context>
Project type detected: ${projectType}
- Ensure LeanKG index is up to date for this project type
- Use mcp__leankg__mcp_status to verify readiness
</project_context>` : "";

  return baseRouting + projectSpecific;
}

// Get forbidden actions
function getForbiddenActions() {
  return `<forbidden_actions>
  - DO NOT use Grep for code search (use mcp__leankg__search_code instead)
  - DO NOT use Bash find/grep for file search (use mcp__leankg__query_file instead)
  - DO NOT use raw grep/rg/fd/fzf in Bash for code discovery
</forbidden_actions>`;
}

// Build session initialization context
function buildSessionContext(input) {
  const cwd = input.cwd || process.cwd();
  const projectType = detectProjectType(cwd);

  let context = getToolRouting(projectType);
  context += "\n\n" + getForbiddenActions();

  // Add LeanKG status reminder
  context += `

<leankg_reminder>
- Run: mcp__leankg__mcp_status to verify LeanKG is ready
- Run: mcp__leankg__mcp_index to index code if needed
- LeanKG is 10-100x faster than raw grep on large codebases
</leankg_reminder>`;

  return context;
}

async function main() {
  try {
    const raw = await readStdin();
    if (!raw.trim()) process.exit(0);

    const input = JSON.parse(raw);
    const toolName = input.tool_name || "";

    // This hook only activates on UserPromptSubmit
    // Check if this is a prompt submission
    if (!input.prompt && !input.user_prompt) {
      process.exit(0);
    }

    const sessionContext = buildSessionContext(input);

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: sessionContext,
      },
    }) + "\n");

  } catch (err) {
    console.error("SessionInit error:", err.message);
    process.exit(0);
  }
}

main();