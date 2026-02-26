import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data");
const dbPath = path.join(dataDir, "clawququ.db");

fs.mkdirSync(dataDir, { recursive: true });

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log(`Deleted: ${dbPath}`);
} else {
  console.log(`No DB found at: ${dbPath}`);
}

console.log("Done. Start dev server to re-seed SQLite from posts.ts.");
