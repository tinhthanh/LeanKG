# Installing LeanKG for Google Antigravity

## Prerequisites

- [Google Antigravity](https://antigravity.google) installed

## Installation

Google Antigravity uses Gemini CLI under the hood. Install via:

```
gemini extensions install https://github.com/FreePeak/LeanKG
```

To update:

```
gemini extensions update leankg
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

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": [
    {
      "name": "leankg",
      "transport": "stdio",
      "command": "leankg",
      "args": ["mcp-stdio", "--watch"],
      "enabled": true
    }
  ]
}
```