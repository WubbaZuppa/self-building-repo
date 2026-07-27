<div align="center">

# 🏗️ self-building-repo

### *This repository builds itself.*

**You describe what you want. AI agents plan, code, review, and ship it — autonomously.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-blue?logo=google&logoColor=white)](https://ai.google.dev/)
[![GitHub Actions](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com/features/actions)

---

*Write a spec → Push → Watch AI agents build your project in real-time*

[📖 How It Works](#-how-it-works) · [🚀 Quick Start](#-quick-start) · [🤖 Meet the Agents](#-meet-the-agents) · [📊 Live Build](#-live-build-progress)

</div>

---

## 🎬 What Is This?

This is **not** a normal repository. There is no human developer writing code here.

Instead, a team of **4 AI agents** collaborates to build software — creating issues, writing code, reviewing pull requests, and tracking progress. Everything happens transparently on GitHub:

- 🎯 **The Architect** reads your spec and creates a build plan
- 💻 **The Builder** picks up tasks and writes the code
- 🔍 **The Guardian** reviews every pull request with detailed feedback
- 📊 **The Herald** tracks progress and keeps everyone informed

Every issue, every PR, every comment — it's all the agents working together. You can watch the entire process unfold in real-time.

> **Think of it as reality TV for software development.** 🍿

---

## 🧠 How It Works

```
   ╔══════════════════════════════════════════════╗
   ║  📝 You write PROJECT_SPEC.md               ║
   ║     "I want a portfolio website with..."     ║
   ╚══════════════════════╤═══════════════════════╝
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │  🎯 THE ARCHITECT                            │
   │  Reads your spec → Creates build phases →    │
   │  Opens GitHub Issues for each task           │
   │  Writes ARCHITECTURE.md                      │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │  💻 THE BUILDER                              │
   │  Picks up an issue → Writes the code →       │
   │  Creates a branch → Opens a Pull Request     │
   │  Explains their thinking in the PR body      │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │  🔍 THE GUARDIAN                             │
   │  Reviews the PR → Checks code quality →      │
   │  Posts detailed review comments →             │
   │  Approves or requests changes                │
   └──────────────────────┬───────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────┐
   │  📊 THE HERALD                               │
   │  Updates progress → Triggers next task →     │
   │  Celebrates milestones 🎉                    │
   └──────────────────────────────────────────────┘
```

---

## 📊 Live Build Progress

<!-- SELF-BUILD:PROGRESS:START -->

| Phase | Status | Description |
|-------|--------|-------------|
| — | ⏳ Waiting | *Push a `PROJECT_SPEC.md` to start the build!* |

```
Progress: ░░░░░░░░░░░░░░░░░░░░ 0%
```

**Status:** 🟡 Waiting for spec...

<!-- SELF-BUILD:PROGRESS:END -->

---

## 🤖 Meet the Agents

<table>
<tr>
<td align="center" width="25%">

### 🎯 The Architect

*Strategic Planning*

The visionary who sees the big picture. Reads your spec and creates a meticulous build plan with phases, dependencies, and architecture decisions.

**Style:** Strategic, uses construction metaphors

</td>
<td align="center" width="25%">

### 💻 The Builder

*Code Development*

The enthusiastic developer who turns plans into code. Picks up tasks, writes clean code, and explains every decision in pull request descriptions.

**Style:** Energetic, shows thought process

</td>
<td align="center" width="25%">

### 🔍 The Guardian

*Code Review*

The thorough reviewer who ensures quality. Examines every line, catches bugs, enforces best practices, and provides constructive feedback.

**Style:** Precise, balances praise and critique

</td>
<td align="center" width="25%">

### 📊 The Herald

*Progress Tracking*

The upbeat reporter who keeps everyone informed. Tracks completion, celebrates milestones, and makes sure the build keeps moving forward.

**Style:** Celebratory, uses progress bars

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Want to try it yourself?

1. **Fork this repo** (or use it as a template)
2. **Get a free Gemini API key** at [aistudio.google.com](https://aistudio.google.com/apikey)
3. **Create a GitHub PAT** with repo permissions
4. **Add secrets** to your repo:
   - `GEMINI_API_KEY` — your Gemini key
   - `AGENT_TOKEN` — your GitHub PAT
5. **Edit `PROJECT_SPEC.md`** — describe what you want to build
6. **Push and watch!** 🍿

📖 **Detailed setup instructions:** [SETUP.md](SETUP.md)

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🆓 **Completely Free** | Uses Gemini 2.0 Flash free tier — no API costs |
| 🔄 **Fully Autonomous** | No human intervention needed after the initial spec |
| 👀 **Transparent** | Every step is visible as GitHub issues, PRs, and comments |
| 🎭 **Personality** | Each agent has a unique character — read their conversations! |
| 🔒 **Safe** | Agents can only modify their own repo — no external access |
| 📊 **Live Progress** | README auto-updates with real-time build progress |
| 🌐 **Community Requests** | Anyone can open an issue to request features |
| 🧠 **Git-Native Memory** | Build state and decisions are stored in the repo itself |

---

## 📁 Project Structure

```
self-building-repo/
├── .github/workflows/     # 🔄 GitHub Actions that orchestrate the agents
│   ├── plan.yml           #    Triggered when PROJECT_SPEC.md changes
│   ├── develop.yml        #    Triggered when a task is ready
│   ├── review.yml         #    Triggered when a PR is opened
│   ├── progress.yml       #    Triggered when a PR is merged
│   └── community-request.yml  # Triggered on community issues
│
├── agents/                # 🤖 The AI agent scripts
│   ├── planner.mjs        #    🎯 The Architect
│   ├── developer.mjs      #    💻 The Builder
│   ├── reviewer.mjs       #    🔍 The Guardian
│   ├── tracker.mjs        #    📊 The Herald
│   └── lib/               #    Shared utilities
│       ├── ai.mjs         #    Gemini API wrapper
│       ├── github.mjs     #    GitHub API wrapper
│       ├── personas.mjs   #    Agent personalities
│       └── config.mjs     #    Configuration
│
├── .self-build/           # 📦 Build state and memory
│   └── state.json         #    Current build progress
│
├── PROJECT_SPEC.md        # 📝 YOUR SPEC — describe what you want!
├── ARCHITECTURE.md        # 🏛️ Auto-generated architecture doc
├── BUILD_LOG.md           # 📋 Auto-generated build diary
├── SETUP.md               # 📖 Setup guide (for non-developers!)
└── README.md              # 👈 You are here
```

---

## 🤔 FAQ

<details>
<summary><b>Is this really free?</b></summary>

Yes! Google Gemini 2.0 Flash has a generous free tier (1500 requests/day). GitHub Actions is free for public repos. The only cost is your time writing the spec.

</details>

<details>
<summary><b>Can I use this for real projects?</b></summary>

This is an experimental/educational project. The AI-generated code is functional but should be reviewed by a human before production use. Think of it as a very advanced prototyping tool.

</details>

<details>
<summary><b>What can I build with this?</b></summary>

Anything that can be described in text! Websites, CLI tools, simple APIs, games — the agents will attempt to build whatever you specify. Complex projects with many dependencies may need multiple iterations.

</details>

<details>
<summary><b>Can I contribute?</b></summary>

Absolutely! Open a PR or issue. The irony of humans contributing to a self-building repo is not lost on us. 😄

</details>

---

## 🏗️ Built With

- [Google Gemini](https://ai.google.dev/) — AI backbone (free tier)
- [GitHub Actions](https://github.com/features/actions) — Orchestration
- [Octokit](https://github.com/octokit/rest.js) — GitHub API client
- Node.js — Runtime

---

## 📜 License

MIT — do whatever you want with it.

---

<div align="center">

**⭐ Star this repo if you think AI building software is cool!**

*Built with 🤖 by AI agents, orchestrated by humans (barely)*

</div>
