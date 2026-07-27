import fs from 'fs/promises';
import { getConfig } from './lib/config.mjs';
import { chatJSON } from './lib/ai.mjs';
import { createOctokit, createIssue, createOrUpdateFile, getFileContent, triggerWorkflow, addComment } from './lib/github.mjs';
import { PERSONAS, formatAgentComment } from './lib/personas.mjs';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('🤖 Starting The Architect (Planner Agent)...');
  const config = getConfig();
  const octokit = createOctokit();
  const { owner, name: repo } = config.repo;

  let specContent = '';
  try {
    specContent = await fs.readFile('PROJECT_SPEC.md', 'utf8');
  } catch (err) {
    try {
      specContent = await getFileContent(octokit, owner, repo, 'PROJECT_SPEC.md', 'main');
    } catch (e) {
      console.error('Failed to read PROJECT_SPEC.md locally or from repo.');
      process.exit(1);
    }
  }

  if (!specContent) {
    console.error('PROJECT_SPEC.md is empty or missing.');
    process.exit(1);
  }

  console.log('📝 Planning phases and tasks...');
  const prompt = `
Analyze the following project specification and break it into 3-6 logical phases.
Each phase should have 1-3 actionable tasks (issues).
Phase 1 tasks have no dependencies and are ready immediately.

Return a JSON object with this exact structure:
{
  "architecture": "Markdown text describing the project architecture, tech stack, and structure...",
  "phases": [
    {
      "phase": 1,
      "name": "Initial Setup",
      "tasks": [
        {
          "title": "Setup basic structure",
          "description": "Create foundational files.",
          "acceptance_criteria": ["Files exist", "Tests pass"],
          "files": ["package.json", "index.js"],
          "priority": "p1"
        }
      ]
    }
  ]
}`;

  const plan = await chatJSON(PERSONAS.planner.systemPrompt, `${prompt}\n\nProject Spec:\n${specContent}`);

  console.log('✅ Plan generated successfully.');

  let state = { phases: {}, issues: {}, currentPhase: 1 };

  // Update ARCHITECTURE.md
  if (!dryRun) {
    await createOrUpdateFile(octokit, owner, repo, 'ARCHITECTURE.md', plan.architecture, 'docs: update architecture [skip ci]', 'main');
    console.log('💾 Updated ARCHITECTURE.md');
  } else {
    console.log('[DRY RUN] Would update ARCHITECTURE.md');
  }

  let firstIssueNumber = null;

  // Create issues
  for (const phase of plan.phases) {
    state.phases[phase.phase] = { name: phase.name, status: phase.phase === 1 ? 'in_progress' : 'pending' };
    
    for (const task of phase.tasks) {
      const labels = ['self-build', `phase-${phase.phase}`, task.priority];
      if (phase.phase === 1) labels.push('ready');

      const body = `### Description\n${task.description}\n\n### Acceptance Criteria\n${task.acceptance_criteria.map(c => `- [ ] ${c}`).join('\n')}\n\n### Affected Files\n${task.files.map(f => `- \`${f}\``).join('\n')}`;

      if (!dryRun) {
        const issue = await createIssue(octokit, owner, repo, task.title, body, labels);
        console.log(`🎫 Created issue #${issue.number} - ${task.title}`);
        
        if (!firstIssueNumber && phase.phase === 1) {
          firstIssueNumber = issue.number;
        }

        state.issues[issue.number] = {
          phase: phase.phase,
          status: phase.phase === 1 ? 'ready' : 'blocked'
        };
      } else {
        console.log(`[DRY RUN] Would create issue: ${task.title} (Phase ${phase.phase})`);
      }
    }
  }

  // Update state.json
  const stateContent = JSON.stringify(state, null, 2);
  if (!dryRun) {
    await createOrUpdateFile(octokit, owner, repo, '.self-build/state.json', stateContent, 'chore: update state [skip ci]', 'main');
    console.log('💾 Updated .self-build/state.json');

    if (firstIssueNumber) {
      const welcomeMessage = formatAgentComment(PERSONAS.planner, `The blueprint is complete. I have laid the foundation and created the initial architectural plans. \nWe have ${plan.phases.length} phases. Let the construction begin! I've marked this issue as ready.`);
      await addComment(octokit, owner, repo, firstIssueNumber, welcomeMessage);
      
      console.log(`🚀 Triggering develop workflow for issue #${firstIssueNumber}`);
      try {
        await triggerWorkflow(octokit, owner, repo, 'develop.yml', 'main', { issue_number: firstIssueNumber.toString() });
      } catch (e) {
        console.log('Could not trigger develop.yml workflow. Proceeding anyway.');
      }
    }
  } else {
    console.log(`[DRY RUN] Would update .self-build/state.json and trigger workflow for first issue.`);
  }

  console.log('🎯 The Architect has finished planning.');
}

main().catch(err => {
  console.error('❌ Planner failed:', err);
  process.exit(1);
});
