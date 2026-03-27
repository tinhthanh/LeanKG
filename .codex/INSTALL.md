# Installing LeanKG for Codex

## Prerequisites

- [OpenAI Codex](https://openai.com/codex) installed

## Installation

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/FreePeak/LeanKG/refs/heads/main/.codex/INSTALL.md
```

## What It Does

LeanKG automatically injects knowledge graph tools into your agent context:

- **Impact Analysis** - Calculate blast radius before making changes
- **Code Search** - Find functions, files, dependencies instantly
- **Test Coverage** - Know what tests cover any code element
- **Call Graphs** - Understand function call chains
- **Context Generation** - Get AI-optimized context for any file

## Quick Usage

```
# Check if LeanKG is ready
mcp_status leankg

# Initialize for your project
mcp_init leankg { path: "/path/to/your/project/.leankg" }

# Ask questions like:
# "What breaks if I change auth.rs?"
# "Where is the login function?"
# "What tests cover the payment module?"
```

## Updating

Tell Codex to re-fetch the instructions to get the latest version.

## Manual MCP Setup

Add to your Codex MCP configuration:

```json
{
  "mcpServers": {
    "leankg": {
      "command": "leankg",
      "args": ["mcp-stdio", "--watch"]
    }
  }
}
```