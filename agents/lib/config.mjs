export function getConfig() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPOSITORY;

  if (!geminiApiKey) throw new Error("GEMINI_API_KEY environment variable is required.");
  if (!githubToken) throw new Error("GITHUB_TOKEN environment variable is required.");
  if (!githubRepo) throw new Error("GITHUB_REPOSITORY environment variable is required.");

  const [owner, name] = githubRepo.split('/');
  if (!owner || !name) throw new Error("GITHUB_REPOSITORY must be in 'owner/name' format.");

  return {
    geminiApiKey,
    githubToken,
    repo: { owner, name },
    model: 'gemini-2.0-flash'
  };
}
