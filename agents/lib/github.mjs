import { Octokit } from '@octokit/rest';
import { getConfig } from './config.mjs';

export function createOctokit() {
  const config = getConfig();
  return new Octokit({ auth: config.githubToken });
}

export async function getFileContent(octokit, owner, repo, path, ref = 'main') {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref
    });
    
    if (Array.isArray(response.data)) {
      throw new Error(`Path ${path} is a directory, not a file.`);
    }
    
    return Buffer.from(response.data.content, 'base64').toString('utf8');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function createOrUpdateFile(octokit, owner, repo, path, content, message, branch = 'main') {
  let sha;
  try {
    const existingFile = await octokit.repos.getContent({
      owner, repo, path, ref: branch
    });
    sha = existingFile.data.sha;
  } catch (error) {
    if (error.status !== 404) throw error;
  }

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    sha,
    branch
  });
}

export async function createBranch(octokit, owner, repo, branchName, fromBranch = 'main') {
  const branchData = await octokit.repos.getBranch({
    owner, repo, branch: fromBranch
  });
  
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: branchData.data.commit.sha
  });
}

export async function createIssue(octokit, owner, repo, title, body, labels = []) {
  const response = await octokit.issues.create({
    owner, repo, title, body, labels
  });
  return response.data;
}

export async function addComment(octokit, owner, repo, issueNumber, body) {
  await octokit.issues.createComment({
    owner, repo, issue_number: issueNumber, body
  });
}

export async function createPullRequest(octokit, owner, repo, title, body, head, base = 'main') {
  const response = await octokit.pulls.create({
    owner, repo, title, head, base, body
  });
  return response.data;
}

export async function mergePullRequest(octokit, owner, repo, prNumber) {
  await octokit.pulls.merge({
    owner, repo, pull_number: prNumber, merge_method: 'squash'
  });
}

export async function getPullRequestDiff(octokit, owner, repo, prNumber) {
  const response = await octokit.pulls.get({
    owner, repo, pull_number: prNumber,
    mediaType: { format: 'diff' }
  });
  return response.data;
}

export async function listIssues(octokit, owner, repo, labels, state = 'open') {
  const response = await octokit.issues.listForRepo({
    owner, repo, state, labels: labels ? labels.join(',') : undefined
  });
  return response.data;
}

export async function getIssue(octokit, owner, repo, issueNumber) {
  const response = await octokit.issues.get({
    owner, repo, issue_number: issueNumber
  });
  return response.data;
}

export async function addLabels(octokit, owner, repo, issueNumber, labels) {
  await octokit.issues.addLabels({
    owner, repo, issue_number: issueNumber, labels
  });
}

export async function closeIssue(octokit, owner, repo, issueNumber) {
  await octokit.issues.update({
    owner, repo, issue_number: issueNumber, state: 'closed'
  });
}

export async function triggerWorkflow(octokit, owner, repo, workflowId, ref, inputs) {
  await octokit.actions.createWorkflowDispatch({
    owner, repo, workflow_id: workflowId, ref, inputs
  });
}

export async function getRepoTree(octokit, owner, repo, ref = 'main') {
  const branchData = await octokit.repos.getBranch({
    owner, repo, branch: ref
  });
  
  const treeSha = branchData.data.commit.commit.tree.sha;
  const response = await octokit.git.getTree({
    owner, repo, tree_sha: treeSha, recursive: '1'
  });
  
  return response.data.tree.map(item => ({
    path: item.path,
    type: item.type === 'blob' ? 'file' : 'directory',
    size: item.size
  }));
}
