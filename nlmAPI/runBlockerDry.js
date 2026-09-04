process.env.NUMBER_BLOCKER_DRY_RUN = "true";
const { run } = await import("./ringbaNumberBlocker.js");
await run();
