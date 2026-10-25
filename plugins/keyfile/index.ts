import { readdir, readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

// Mirrors each key file into a per-container connection, so the TUI pickers list the
// provider. Connections are derived, not authoritative: the files stay the source, and
// setup runs again on every server start and on `opencode reload`.
//
// Convention: <secrets dir>/<integration id>.key, for example opencode-go.key.
const DEFAULT_SECRETS_DIR = join(homedir(), ".config/opencode/secrets/integrations")
const LABEL = "keyfile"

type Options = {
  secretsDir?: string
}

function secretsDirFor(options: Options | undefined): string {
  const configured = options?.secretsDir?.trim()
  if (!configured) return DEFAULT_SECRETS_DIR
  if (configured === "~") return homedir()
  if (configured.startsWith("~/")) return join(homedir(), configured.slice(2))
  return configured
}

export default {
  id: "wknd.keyfile",
  async setup(ctx: any) {
    const secretsDir = secretsDirFor(ctx.options)
    const entries = await readdir(secretsDir).catch(() => [])

    for (const entry of entries) {
      if (!entry.endsWith(".key")) continue
      const integrationID = entry.slice(0, -".key".length)

      try {
        const known = await ctx.integration.get({ integrationID }).catch(() => undefined)
        if (!known) continue

        const key = await readFile(join(secretsDir, entry), "utf8")
          .then((value) => value.trim())
          .catch(() => "")
        if (!key) continue

        const active = await ctx.integration.connection.active(integrationID)
        const current = active
          ? await ctx.integration.connection.resolve(active)
          : undefined
        if (current && current.type === "key" && current.key === key) continue

        await ctx.integration.connect.key({ integrationID, key, label: LABEL })
      } catch (error) {
        console.error(`keyfile plugin: could not connect ${integrationID}:`, error)
      }
    }
  },
}
