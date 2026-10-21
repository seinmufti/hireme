// Starts the demo (/hireme/demo) on port 3002, next to the real app on port 3000. It has its own
// build folder (.next-demo) and its own browser storage (a different address).
import { spawn } from "node:child_process"

const child = spawn("npx", ["next", "dev", "-p", "3002"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_HIREME_MODE: "demo" },
})
child.on("exit", (code) => process.exit(code ?? 0))
