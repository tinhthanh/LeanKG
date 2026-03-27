# Installing LeanKG for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add LeanKG to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugins": ["leankg@git+https://github.com/FreePeak/LeanKG.git"]
}
```

Restart OpenCode. LeanKG tools will auto-activate on every prompt.

## What It Does

The plugin automatically injects LeanKG knowledge graph tools into your agent context:

- **Impact Analysis** - Calculate blast radius before making changes
- **Code Search** - Find functions, files, dependencies instantly
- **Test Coverage** - Know what tests cover any code element
- **Call Graphs** - Understand function call chains
- **Context Generation** - Get AI-optimized context for any file

## Quick Usage

```
# Check if LeanKG is ready
mcp_status

# Initialize for your project
mcp_init({ path: "/path/to/your/project/.leankg" })

# Ask questions like:
# "What breaks if I change auth.rs?"
# "Where is the login function?"
# "What tests cover the payment module?"
```

## Updating

LeanKG updates automatically when you restart OpenCode.

To pin a specific version:

```json
{
  "plugins": ["leankg@git+https://github.com/FreePeak/LeanKG.git#v0.1.0"]
}
```