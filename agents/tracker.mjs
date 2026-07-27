import { getConfig } from './lib/config.mjs';
import { createOctokit, getFileContent, createOrUpdateFile, listIssues, triggerWorkflow } from './lib/github.mjs';
import { PERSONAS, formatAgentComment } from './lib/personas.mjs';

async function main() {
  console.log('📊 Starting The Herald (Tracker Agent)...');
  const config = getConfig();
  const octokit = createOctokit();
  const { owner, name: repo } = config.repo;

  let stateStr = '';
  try {
    stateStr = await getFileContent(octokit, owner, repo, '.self-build/state.json', 'main');
  } catch (e) {
    console.error('Could not find .self-build/state.json. Is the planner done?');
    process.exit(0);
  }
  
  const state = JSON.parse(stateStr);
  const issues = await listIssues(octokit, owner, repo, ['self-build'], 'all');
  
  let total = 0;
  let closed = 0;
  
  for (const issue of issues) {
    if (!issue.pull_request) {
      total++;
      if (issue.state === 'closed') closed++;
    }
  }

  const percentage = total === 0 ? 0 : Math.round((closed / total) * 100);
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage}%`;

  console.log(`📈 Progress: ${progressBar} (${closed}/${total} issues)`);

  let readme = '';
  try {
    readme = await getFileContent(octokit, owner, repo, 'README.md', 'main') || '';
  } catch (e) {}

  const progressSection = `
### 🏗️ Project Progress

${progressBar}
**Completed:** ${closed} / **Total:** ${total} tasks.

*(Last updated: ${new Date().toISOString()})*
`;

  const regex = /<!-- SELF-BUILD:PROGRESS:START -->[\s\S]*<!-- SELF-BUILD:PROGRESS:END -->/;
  const fullReplacement = `<!-- SELF-BUILD:PROGRESS:START -->\n${progressSection}\n<!-- SELF-BUILD:PROGRESS:END -->`;

  if (regex.test(readme)) {
    readme = readme.replace(regex, fullReplacement);
  } else {
    readme += `\n\n${fullReplacement}\n`;
  }

  await createOrUpdateFile(octokit, owner, repo, 'README.md', readme, 'docs: update progress [skip ci]', 'main');
  console.log('💾 Updated README.md');

  // Trigger next
  let openIssues = issues.filter(i => !i.pull_request && i.state === 'open');
  let readyIssue = openIssues.find(i => i.labels.some(l => l.name === 'ready'));

  if (!readyIssue) {
    console.log('No ready issues found. Looking for other open issues as fallback.');
    if (openIssues.length > 0) {
      readyIssue = openIssues[0];
      console.log(`Auto-selecting issue #${readyIssue.number} as next ready issue.`);
    }
  }

  if (readyIssue) {
    console.log(`🚀 Triggering develop workflow for issue #${readyIssue.number}`);
    try {
       await triggerWorkflow(octokit, owner, repo, 'develop.yml', 'main', { issue_number: readyIssue.number.toString() });
    } catch(e) {
       console.log('Could not trigger develop.yml, it might not exist yet.');
    }
  } else {
    console.log('🎉 No open issues found. Project complete!');
  }

  console.log('📊 The Herald has finished updating.');
}

main().catch(err => {
  console.error('❌ Tracker failed:', err);
  process.exit(1);
});
