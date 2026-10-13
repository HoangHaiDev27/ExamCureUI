import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function readEnv(relativePath) {
  try {
    return Object.fromEntries(
      readFileSync(
        fileURLToPath(new URL(relativePath, import.meta.url)),
        "utf8",
      )
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim() && !line.trim().startsWith("#") && line.includes("="),
        )
        .map((line) => {
          const index = line.indexOf("=");
          return [
            line.slice(0, index).trim(),
            line
              .slice(index + 1)
              .trim()
              .replace(/^(['"])(.*)\1$/, "$2"),
          ];
        }),
    );
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

const frontend = { ...readEnv("../.env.local"), ...process.env };
const backend = readEnv("../../ExamcureBe/.env");
const errors = [];
const present = (value) =>
  Boolean(value?.trim() && !/YOUR_|your_|USER:PASSWORD/.test(value));
const origin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const apiUrl = frontend.NEXT_PUBLIC_API_URL || "/api/v1";
const target = frontend.EXAMCURE_API_URL || "http://localhost:5010";
if (apiUrl !== "/api/v1" && (!origin(apiUrl) || !/\/api\/v1\/?$/.test(apiUrl)))
  errors.push(
    "NEXT_PUBLIC_API_URL phải là /api/v1 hoặc URL backend kết thúc bằng /api/v1.",
  );
if (!origin(target) || new URL(target).pathname !== "/")
  errors.push("EXAMCURE_API_URL phải là origin của ExamcureBe.");
if ((backend.JWT_SECRET || "").length < 32)
  errors.push("Backend cần JWT_SECRET ít nhất 32 ký tự.");
if (
  frontend.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" &&
  ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"].some(
    (name) => !present(backend[name]),
  )
)
  errors.push("Backend cần đủ ba biến Google OAuth.");
if (
  !present(backend.MONGODB_URI) ||
  !/^mongodb(\+srv)?:\/\//.test(backend.MONGODB_URI || "")
)
  errors.push(
    "Backend cần MONGODB_URI trỏ tới MongoDB replica set hoặc Atlas.",
  );
if (backend.NODE_ENV === "production") {
  for (const key of [
    "MONGODB_URI",
    "SMTP_HOST",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "API_PUBLIC_URL",
  ])
    if (!present(backend[key])) errors.push(`Backend production cần ${key}.`);
  if (backend.STORAGE_DRIVER !== "s3")
    errors.push("Production cần STORAGE_DRIVER=s3.");
}
if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(
    "Cấu hình auth/API cơ bản hợp lệ. MongoDB/OpenAI/SMTP cần kiểm tra kết nối riêng.",
  );
  console.log(`API: ${apiUrl}`);
}
