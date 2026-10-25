# OpenCode setup

How the CLI is installed and configured on my machines, and the traps to know about.

## Install

The CLI is `@opencode/cli`. `opencode-ai` on npm is still v1, so anything that assumes
`npx opencode-ai@latest` pulls the old major.

My containers install it from `postCreate.sh` in
[opencode-project-template](https://github.com/wknd-tooling/opencode-project-template),
pinned by `OPENCODE_VERSION`. Two things that cost time to rediscover:

- npm 11 blocks install-time lifecycle scripts unless the package is allowlisted, so the
  install passes `--allow-scripts=@opencode/cli`. Without it the postinstall does not run
  and the platform binary is not selected.
- `--env-file` is applied when the container is created, so rebuild after changing the
  install flag or the version.

## Config layout

| Path | Contents |
| --- | --- |
| `~/.config/opencode/opencode.jsonc` | Global config, auto-loaded everywhere. Lives on the shared volume |
| `~/.config/opencode/secrets/` | API keys, read with `{file:...}`. Never in git |
| `~/.config/opencode/cli.json` | Terminal client config: keybinds, theme, scroll |
| `~/.local/share/opencode/` | Sessions DB, tool output, logs. Per container |
| `<repo>/opencode.jsonc` | Project config, one per repository |

## Credentials: the one rule

```jsonc
"providers": {
  // opencode/* and opencode-go/* are separate providers with separate catalogs.
  "opencode":    { "settings": { "apiKey": "{file:~/.config/opencode/secrets/opencode.key}" } },
  "opencode-go": { "settings": { "apiKey": "{file:~/.config/opencode/secrets/opencode.key}" } }
}
```

**`opencode auth list` must stay empty.** A credential saved by `/connect` outranks
`settings.apiKey`, whether it sits in a row of `opencode.db` or in a legacy
`~/.local/share/opencode/auth.json`. A stale stored key shadows the key file, and
every request fails with `Invalid credential`. If an integration shows as stored,
remove it with `opencode auth logout <provider>` and delete the legacy `auth.json`.
For the same reason, never accept an in-editor login prompt: it is `/connect` by
another name.

## Default model

Model selection is stored per container in `~/.local/state/opencode`, so a container with a
fresh `~/.local` starts with no remembered choice and falls back to whatever the catalog
offers first. In practice that means a project can start on a model you did not pick, even
though the provider and its models are configured correctly.

Set the default in the global config if a fresh container should start on a specific model:

```jsonc
"model": "opencode-go/deepseek-v4.1-flash"
```

Picking a model with `/models` writes to the per-container state, so that choice does not
travel to the next project. The config value does.

## Keybinds

`cli.json` is read by the TUI at startup only. Home/End and PageUp/PageDown are
bound to chat history by default; to make them control the prompt instead:

```jsonc
"keybinds": {
  "session.first": "ctrl+g,alt+home",
  "session.last": "ctrl+alt+g,alt+end",
  "session.page.up": "ctrl+alt+b",
  "session.page.down": "ctrl+alt+f",
  "input.visual.line.home": ["alt+a", "home"],
  "input.visual.line.end": ["alt+e", "end"]
}
```

## Editor

Editor setup lives in a VS Code profile, not in the repository, so a clone does not force
tooling on anyone. My profile for this work is:

```jsonc
{
  // Hide the built-in AI surface: chat, inline suggestions, Copilot extensions.
  "chat.disableAIFeatures": true,
  // No chat button in the title bar.
  "chat.commandCenter.enabled": false,
  // No inline completions from any provider.
  "editor.inlineSuggest.enabled": false,
  // Do not import MCP servers from other apps.
  "chat.mcp.discovery.enabled": {
    "claude-desktop": false,
    "copilot": false,
    "windsurf": false,
    "cursor-global": false,
    "cursor-workspace": false
  },
  // The built-in chat gets no MCP tools. opencode owns its own MCP config.
  "chat.mcp.access": "none",
  // The one agent extension this profile installs into every container.
  "dev.containers.defaultExtensions": [
    "sst-dev.opencode"
  ],
  // No hint line in a fresh terminal.
  "terminal.integrated.initialHint": false
}
```

One agent extension per profile, not several. `chat.disableAIFeatures` already disables the
Copilot extensions, so a profile that carries another agent would be fighting itself.

The OpenCode extension is glue only: it opens a terminal, sets `OPENCODE_CALLER=vscode`,
types `opencode`, and forwards editor selections to that terminal. It ships no binary and
has no version logic, so it uses whatever `opencode` is on the container's `PATH`, which is
the `postCreate.sh` install described above. Without that install the extension types a
command that does not exist.

UI settings (theme, fonts, keymap) belong in the same profile. The project's `.vscode/`
directory is gitignored for that reason, except `launch.json` and `tasks.json`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Invalid credential` on every message | stale stored credential shadowing the key file | `opencode auth list`, then `opencode auth logout` |
| `✗ kagi failed` and the search tools vanish | `kagimcp` died after a cancelled request (`Request already responded to`) | `opencode reload` |
| Model missing from the picker | provider has no credential configured | add the provider block, or check `auth list` |
| Skills/tools unavailable after a config edit | server has not reloaded | `opencode reload` |

## Model choice

`opencode-go/*` is the flat-rate plan and the default. Do not run a whole evening
on a frontier model: agent loops replay context every turn, so cost scales with
session length and cache pricing, not with model quality alone. Route frontier
models to short, continuous review sessions on prepaid credit.

## MCP servers

Example: Kagi search over stdio, with the key read from a file on the shared volume.

```jsonc
"mcp": {
  "servers": {
    "kagi": {
      "type": "local",
      "command": ["uvx", "kagimcp"],
      "environment": { "KAGI_API_KEY": "{file:~/.config/opencode/secrets/kagi.key}" }
    }
  }
}
```

`opencode mcp list` shows connection status. A Python MCP server that dies (for
example `kagimcp` after a request is cancelled mid-flight) is not restarted
automatically. The tools silently disappear until `opencode reload`.
