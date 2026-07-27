import { getConfig } from './lib/config.mjs';
import { chat } from './lib/ai.mjs';
import { createOctokit, getIssue, addComment } from './lib/github.mjs';
import { PERSONAS, formatAgentComment } from './lib/personas.mjs';

async function main() {
  const issueArgIndex = process.argv.indexOf('--issue');
  if (issueArgIndex === -1 || !process.argv[issueArgIndex + 1]) {
    console.error('Missing --issue <number> argument.');
    process.exit(1);
  }
  const issueNumber = parseInt(process.argv[issueArgIndex + 1], 10);

  console.log(`💬 Starting The Architect (Responder Agent) for issue #${issueNumber}...`);
  const config = getConfig();
  const octokit = createOctokit();
  const { owner, name: repo } = config.repo;

  const issue = await getIssue(octokit, owner, repo, issueNumber);
  console.log(`🎫 Loaded community issue #${issueNumber}: ${issue.title}`);

  const prompt = `
A visitor/user has sent a message or feature request on our self-building repository:
Title: ${issue.title}
Body: ${issue.body}

Write a friendly, enthusiastic, and helpful response acknowledging their message, thanking them for reaching out, and explaining that the AI agents team is here to help! Keep it concise (1-2 paragraphs).`;

  console.log('🧠 Generating AI response...');
  const aiResponse = await chat(PERSONAS.planner.systemPrompt, prompt);

  const commentBody = formatAgentComment(PERSONAS.planner, aiResponse);
  
  await addComment(octokit, owner, repo, issueNumber, commentBody);
  console.log(`✅ Posted AI response comment on issue #${issueNumber}!`);
}

main().catch(err => {
  console.error('❌ Responder failed:', err);
  process.exit(1);
});
