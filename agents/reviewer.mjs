import { getConfig } from './lib/config.mjs';
import { chatJSON } from './lib/ai.mjs';
import { createOctokit, getPullRequestDiff, addComment, mergePullRequest } from './lib/github.mjs';
import { PERSONAS, formatAgentComment } from './lib/personas.mjs';

async function main() {
  const prArgIndex = process.argv.indexOf('--pr');
  if (prArgIndex === -1 || !process.argv[prArgIndex + 1]) {
    console.error('Missing --pr <number> argument.');
    process.exit(1);
  }
  const prNumber = parseInt(process.argv[prArgIndex + 1], 10);

  console.log(`🔍 Starting The Guardian (Reviewer Agent) for PR #${prNumber}...`);
  const config = getConfig();
  const octokit = createOctokit();
  const { owner, name: repo } = config.repo;

  const diff = await getPullRequestDiff(octokit, owner, repo, prNumber);
  
  const prompt = `
Review the following pull request diff. Look for:
1. Logic errors or bugs
2. Security issues
3. Clean code practices
4. Completeness

Give a score from 1 to 10 (be lenient for v1, score 5+ to approve).
Return JSON:
{
  "score": 8,
  "decision": "APPROVE", 
  "review_summary": "General assessment...",
  "feedback": [
    "Great job on X...",
    "Consider changing Y to Z..."
  ]
}

Diff:
${diff}`;

  console.log('🧠 Analyzing code diff...');
  const review = await chatJSON(PERSONAS.reviewer.systemPrompt, prompt);

  console.log(`📊 Score: ${review.score}/10, Decision: ${review.decision}`);

  const body = formatAgentComment(PERSONAS.reviewer, `I have thoroughly inspected these changes.

**Score:** ${review.score}/10

**Assessment:**
${review.review_summary}

**Detailed Feedback:**
${review.feedback.map(f => `- ${f}`).join('\n')}`);

  await addComment(octokit, owner, repo, prNumber, body);

  if (review.score >= 5 || review.decision === 'APPROVE') {
    console.log('✅ Approving and merging PR...');
    await octokit.pulls.createReview({
      owner, repo, pull_number: prNumber, event: 'APPROVE', body: 'Looks good to me.'
    });
    await mergePullRequest(octokit, owner, repo, prNumber);
    console.log('🎉 PR merged successfully.');
  } else {
    console.log('❌ Requesting changes...');
    await octokit.pulls.createReview({
      owner, repo, pull_number: prNumber, event: 'REQUEST_CHANGES', body: 'Please address the feedback in the comments.'
    });
  }

  console.log('🔍 The Guardian has finished reviewing.');
}

main().catch(err => {
  console.error('❌ Reviewer failed:', err);
  process.exit(1);
});
