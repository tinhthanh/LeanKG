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
- \`mcp_status\` - Check if LeanKG is initialized
- \`mcp_init\` - Initialize LeanKG for a project
- \`mcp_index\` - Index codebase
- \`search_code\` - Search code elements by name/type
- \`find_function\` - Locate function definitions
- \`get_impact_radius\` - Calculate blast radius of changes
- \`get_dependencies\` - Get direct imports of a file
- \`get_dependents\` - Get files depending on target
- \`get_context\` - Get AI-optimized context for a file
- \`get_tested_by\` - Get test coverage info
- \`query_file\` - Find files by name/pattern
- \`get_call_graph\` - Get function call chains
- \`find_large_functions\` - Find oversized functions
- \`get_doc_for_file\` - Get documentation for a file
- \`get_traceability\` - Get full traceability chain
- \`get_code_tree\` - Get codebase structure
- \`get_doc_tree\` - Get documentation tree

**Workflow:**
1. Before ANY codebase search/navigation, check \`mcp_status\`
2. If not initialized, use \`mcp_init\` with project path
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