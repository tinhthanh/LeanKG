# Installing LeanKG for Kilo Code

## Prerequisites

- [Kilo Code](https://kilo.ai) installed

## Installation

Tell Kilo Code:

```
Fetch and follow instructions from https://raw.githubusercontent.com/FreePeak/LeanKG/refs/heads/main/.kilo/INSTALL.md
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

## Manual MCP Setup

Add to `~/.config/kilo/kilo.json`:

```json
{
  "$schema": "https://kilo.ai/config.json",
  "mcp": {
    "leankg": {
      "type": "local",
      "command": ["leankg", "mcp-stdio", "--watch"],
      "enabled": true
    }
  }
}
```