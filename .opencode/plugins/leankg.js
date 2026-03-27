/**
 * LeanKG plugin for OpenCode.ai
 *
 * Auto-injects LeanKG knowledge graph tools into the agent's context.
 * Enhances codebase understanding, dependency analysis, and impact tracking.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getLeanKGContext = () => `
<LEANKG_BOOTSTRAP>
LeanKG is a lightweight knowledge graph for codebase understanding.

**Auto-Activated Tools:**
- \`leankg_mcp_status\` - Check if LeanKG is initialized
- \`leankg_mcp_init\` - Initialize LeanKG for a project
- \`leankg_search_code\` - Search code elements by name/type
- \`leankg_find_function\` - Locate function definitions
- \`leankg_get_impact_radius\` - Calculate blast radius of changes
- \`leankg_get_dependencies\` - Get direct imports of a file
- \`leankg_get_dependents\` - Get files depending on target
- \`leankg_get_context\` - Get AI-optimized context for a file
- \`leankg_get_tested_by\` - Get test coverage info
- \`leankg_query_file\` - Find files by name/pattern
- \`leankg_get_call_graph\` - Get function call chains
- \`leankg_find_large_functions\` - Find oversized functions

**Workflow:**
1. Before ANY codebase search/navigation, check \`leankg_mcp_status\`
2. If not initialized, use \`leankg_mcp_init\` with project path
3. Use LeanKG tools first - only fallback to grep if LeanKG fails

**When user asks about:**
- "What breaks if I change X?" → Use \`get_impact_radius\`
- "Where is X defined?" → Use \`search_code\` or \`find_function\`
- "How does X work?" → Use \`get_context\` or \`get_call_graph\`
- "What tests cover X?" → Use \`get_tested_by\`
</LEANKG_BOOTSTRAP>
`;

export const LeanKGPlugin = async ({ client, directory }) => {
  const skillsDir = path.resolve(__dirname, '../skills');

  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    'experimental.chat.system.transform': async (_input, output) => {
      (output.system ||= []).push(getLeanKGContext());
    }
  };
};