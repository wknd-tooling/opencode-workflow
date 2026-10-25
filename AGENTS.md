# opencode workflow

My defaults. A repository's own AGENTS.md wins where it conflicts.

## Environment

- You are already in a container and that is the boundary: the project and the mounted
  config, nothing else from the machine. Do not try to get out of it.
- If a task needs something from outside the container, ask instead of working around the
  boundary.

## Long-running commands

- Set `background: true` on the shell tool for servers, builds, big test suites and anything else that
  runs long, so the chat is not blocked. Background calls return immediately, have no timeout unless one
  is given, and notify the session when they finish.
- Do not decorate commands. No `| head`, no `| tail`, no `> file`, no `2>&1`. Run the command as intended.
  opencode trims large output for display but keeps the complete output in a managed file.
- When output is shortened, read the managed output file the result points at, with offset/limit, instead
  of re-running the command. Read other parts of that same file later when more is needed.
- Never re-run a command just to look at different output.

## Project memory

- Per-project memory lives in `<project>/.opencode/memory/AGENTS.md`, kept out of git by a `.gitignore`
  containing `*` inside that directory. Git then ignores that folder entirely, including the `.gitignore`.
- At the start of a session, if that file exists, read it before doing anything else.
- When I say to remember something for this project, append it there concisely. When I correct or revoke
  something, edit or remove that entry rather than adding a contradiction.
- Keep entries short and operational: decisions, gotchas, conventions. Do not paste session notes.
- Never stage or commit it.

## Changes and review

- Leave changes unstaged in the working tree. I review with `git` myself.
- Do not use the agent's own change tracking as the review surface. It only sees edits the agent made.
  When I ask what changed, derive it from `git status` / `git diff`.
- Finish a piece of work with `git status --short` and `git diff --stat` so I can see the shape of the change.

## Commits

- A commit message carries the human who approved the commit, not the tool that wrote the code. No co-author
  trailers for models, no "generated with" footers.
- Aim for commits that can be reviewed one at a time. Each one should hold a single change, the reason for
  it, and whatever verifies it.
- Do not leave a trail of work-in-progress commits that only make sense in sequence. Rewrite the branch
  before handing it over.
- Squashing is fine while a branch is private, and for a repository that has not been published yet. At
  merge time, either squash, or keep the history once it has been rewritten into something readable.
