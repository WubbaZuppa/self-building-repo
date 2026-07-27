import { getConfig } from './lib/config.mjs';
import { chatJSON } from './lib/ai.mjs';
import { createOctokit, getIssue, getRepoTree, getFileContent, createBranch, createOrUpdateFile, createPullRequest, addLabels } from './lib/github.mjs';
import { PERSONAS, formatAgentComment } from './lib/personas.mjs';

async function main() {
  const issueArgIndex = process.argv.indexOf('--issue');
  if (issueArgIndex === -1 || !process.argv[issueArgIndex + 1]) {
    console.error('Missing --issue <number> argument.');
    process.exit(1);
  }
  const issueNumber = parseInt(process.argv[issueArgIndex + 1], 10);

  console.log(`💻 Starting The Builder (Developer Agent) for issue #${issueNumber}...`);
  const config = getConfig();
  const octokit = createOctokit();
  const { owner, name: repo } = config.repo;

  const issue = await getIssue(octokit, owner, repo, issueNumber);
  console.log(`🎫 Loaded issue: ${issue.title}`);

  const tree = await getRepoTree(octokit, owner, repo, 'main');
  const treeStr = tree.map(item => `${item.type}: ${item.path}`).join('\n');
  
  let architecture = '';
  try { architecture = await getFileContent(octokit, owner, repo, 'ARCHITECTURE.md', 'main') || ''; } catch(e) {}

  const prompt = `
You need to write code to resolve the following issue:
Title: ${issue.title}
Body: ${issue.body}

Here is the current architecture:
${architecture}

Current repo file tree:
${treeStr}

Generate the necessary file contents to resolve this issue. Return a JSON object with this structure:
{
  "thought_process": "Explanation of what you are building and why.",
  "files": [
    {
      "path": "path/to/file.js",
      "content": "// File content here..."
    }
  ]
}
Ensure the paths match the repository structure. Complete, fully functional code is required. No placeholders.`;

  console.log('🧠 Thinking and writing code...');
  const result = await chatJSON(PERSONAS.developer.systemPrompt, prompt);

  const slug = issue.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
  const branchName = `self-build/issue-${issueNumber}-${slug}`;
  console.log(`🌿 Creating branch: ${branchName}`);
  
  await createBranch(octokit, owner, repo, branchName, 'main');

  for (const file of result.files) {
    console.log(`📝 Writing file: ${file.path}`);
    await createOrUpdateFile(octokit, owner, repo, file.path, file.content, `feat: issue #${issueNumber} - ${file.path}`, branchName);
  }

  console.log('🔄 Creating Pull Request...');
  const prBody = formatAgentComment(PERSONAS.developer, `I have constructed the required components for this issue.

**Thought Process:**
${result.thought_process}

**Changes:**
${result.files.map(f => `- \`${f.path}\``).join('\n')}

Closes #${issueNumber}`);

  const pr = await createPullRequest(octokit, owner, repo, `Resolve #${issueNumber}: ${issue.title}`, prBody, branchName, 'main');
  await addLabels(octokit, owner, repo, pr.number, ['self-build']);

  console.log(`✅ PR created: ${pr.html_url}`);
  console.log('💻 The Builder has finished building.');
}

main().catch(err => {
  console.error('❌ Developer failed:', err);
  process.exit(1);
});
