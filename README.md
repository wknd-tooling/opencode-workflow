# opencode-workflow

My standard opencode workflow, kept in one place. `setup.md` covers installing and
configuring the tool itself.

This is the text that ends up as `~/.config/opencode/AGENTS.md`, which opencode loads by
default in my sessions. It is not copied into individual repositories, because copies of
the same rules drift apart and there is no point pretending otherwise.

## How it is wired

The repository is cloned onto the shared config volume and symlinked into place:

```bash
git clone git@github.com:wknd-tooling/opencode-workflow.git ~/.config/opencode/workflow
ln -sfn workflow/AGENTS.md ~/.config/opencode/AGENTS.md
```

Because the config volume is shared between containers, the same file is there in any
container I open. Editing it here and pulling is the only update path.

The container definition itself lives in
[opencode-project-template](https://github.com/wknd-tooling/opencode-project-template).

A project that needs different rules puts them in its own `AGENTS.md`; that file wins over
this one where they conflict.

## Where AI runs

AI runs in a container, not on the host. The container gets the project and the shared
config volume, and that is all it gets from the machine.

A container is a boundary, not a guarantee. An agent can still escape one, and anything
that gives it more access makes that easier: Docker-in-Docker, a mounted container
runtime socket, a bind-mounted home directory. Treat the container as the minimum and be
deliberate about what else the agent can reach.

## What belongs here

- How long-running commands are run, and how their output is read afterwards.
- Where per-project memory lives and how it is written.
- How changes are reviewed, and who is allowed to commit them.
- Anything else that applies across repositories regardless of language or stack.

Installing and configuring the tool goes in `setup.md`, not in `AGENTS.md`: the first is
reference material for me, the second is loaded into every session.

Project-specific commands, layout and gotchas do not belong here. They go in the project's
own `AGENTS.md`.

## Licence

Personal, non-commercial use only. See `LICENSE`.
