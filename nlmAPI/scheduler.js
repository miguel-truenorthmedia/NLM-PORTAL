import "dotenv/config";
import cron from "node-cron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import schedules from "./schedules.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_ONCE = process.argv.includes("--once");

function runScript(script, args = []) {
  const scriptPath = path.join(__dirname, script);
  console.log(
    `[scheduler] Starting ${script}${args.length ? ` ${args.join(" ")}` : ""}`
  );

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: __dirname,
      stdio: "inherit",
      env: process.env,
    });

    child.on("exit", (code) => {
      console.log(`[scheduler] ${script} exited with code ${code}`);
      resolve(code);
    });
  });
}

if (!schedules.length) {
  console.warn("[scheduler] No schedules configured.");
  process.exit(0);
}

if (RUN_ONCE) {
  console.log("[scheduler] Running all jobs once, then exiting.");
  for (const entry of schedules) {
    await runScript(entry.script, entry.args || []);
  }
  process.exit(0);
}

for (const entry of schedules) {
  const { script, schedule, args = [], timezone, description } = entry;
  if (!script || !schedule) {
    console.warn("[scheduler] Skipping invalid entry:", entry);
    continue;
  }
  if (!cron.validate(schedule)) {
    console.warn(`[scheduler] Invalid cron "${schedule}" for ${script}`);
    continue;
  }

  console.log(
    `[scheduler] Register ${script} → ${schedule}` +
      (timezone ? ` (${timezone})` : "") +
      (description ? ` — ${description}` : "")
  );

  cron.schedule(schedule, () => runScript(script, args), timezone ? { timezone } : undefined);
}

console.log("[scheduler] nlmAPI running. Ctrl+C to stop.");
