// Starts a second copy of the app on port 3001 with its own build folder.
// It has its own browser storage (a different address), so tests on it never touch the data saved by
// the main app on port 3000.
import { spawn } from "node:child_process"

const child = spawn("npx", ["next", "dev", "-p", "3001"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, HIREME_TEST_SERVER: "1", NEXT_PUBLIC_HIREME_MODE: "demo" },
})
child.on("exit", (code) => process.exit(code ?? 0))
