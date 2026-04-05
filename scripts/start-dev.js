const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// .env 파일 직접 파싱
const envPath = path.join(__dirname, "../.env");
const envVars = {};
try {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^\s*([^#\s][^=]*?)\s*=\s*(.*?)\s*$/);
      if (match) envVars[match[1]] = match[2].replace(/^["'](.*)["']$/, "$1");
    });
} catch {}

const port = envVars.PORT || process.env.PORT || 3000;
console.log(`> 포트 ${port}번으로 시작합니다...`);

execFileSync(
  process.execPath,
  ["./node_modules/.bin/next", "dev", "-p", String(port)],
  { stdio: "inherit", env: { ...process.env, PORT: String(port) } }
);
