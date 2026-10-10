import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readEnv(relativePath) {
  try {
    return Object.fromEntries(readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), "utf8")
      .split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, "$2")];
      }));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

const frontend = { ...readEnv("../.env.local"), ...process.env };
const backend = readEnv("../../ExamcureBe/.env");
const errors = [];
const present = (value) => Boolean(value?.trim() && !/YOUR_|your_|USER:PASSWORD/.test(value));
const origin = (value) => { try { return new URL(value).origin; } catch { return null; } };

for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
  if (!present(frontend[name])) errors.push(`Frontend: cần cấu hình ${name}.`);
}
for (const name of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!present(backend[name])) errors.push(`Backend local: cần cấu hình ${name}.`);
}
const frontendProject = origin(frontend.NEXT_PUBLIC_SUPABASE_URL);
const backendProject = origin(backend.SUPABASE_URL);
if (present(frontend.NEXT_PUBLIC_SUPABASE_URL) && !frontendProject) errors.push("URL Supabase frontend không hợp lệ.");
if (present(backend.SUPABASE_URL) && !backendProject) errors.push("URL Supabase backend không hợp lệ.");
if (present(frontend.NEXT_PUBLIC_SUPABASE_URL) && present(backend.SUPABASE_URL) && frontendProject !== backendProject) {
  errors.push("Frontend và backend phải dùng cùng một project Supabase.");
}

const publicKey = frontend.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
let keyRole;
try { keyRole = JSON.parse(Buffer.from(publicKey.split(".")[1], "base64url").toString()).role; } catch { /* Publishable keys are not JWTs. */ }
if (publicKey.startsWith("sb_secret_") || keyRole === "service_role" ||
    (present(publicKey) && publicKey === backend.SUPABASE_SERVICE_ROLE_KEY)) {
  errors.push("Frontend phải dùng anon/publishable key; không dùng service-role/secret key.");
}
if (backend.ENABLE_LEGACY_AUTH === "true") errors.push("Đặt ENABLE_LEGACY_AUTH=false để thống nhất Supabase Auth.");
const apiUrl = frontend.NEXT_PUBLIC_API_URL || "http://localhost:5010/api/v1";
if (!origin(apiUrl) || !/\/api\/v1\/?$/.test(apiUrl)) errors.push("NEXT_PUBLIC_API_URL phải là URL backend có hậu tố /api/v1.");

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("Cấu hình local hợp lệ: cùng project Supabase, public key riêng và auth cũ đã tắt.");
  console.log(`API: ${apiUrl}`);
}
