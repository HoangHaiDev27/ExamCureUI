import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { startMongoFixture } from "../../ExamcureBe/scripts/mongo-test-fixture.mjs";
import { createServer } from "node:net";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Run after building both repos. Use only an isolated MongoDB replica set, never the
// user's database or services. Check the actual production Next.js proxy.
const manifest = JSON.parse(
  await readFile(
    new URL("../.next/routes-manifest.json", import.meta.url),
    "utf8",
  ),
);
const rewrite = manifest.rewrites.afterFiles.find(
  (r) => r.source === "/api/v1/:path*",
);
const destination = new URL(rewrite.destination);
assert.ok(
  ["localhost", "127.0.0.1"].includes(destination.hostname),
  "Smoke test requires a local backend rewrite",
);
const backendPort = Number(destination.port || 80);
const reservation = createServer();
await new Promise((resolve, reject) => {
  reservation.once("error", reject);
  reservation.listen(0, "127.0.0.1", resolve);
});
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const frontend = fileURLToPath(new URL("..", import.meta.url));
const appModule = new URL("../../ExamcureBe/dist/app.js", import.meta.url).href;
const configModule = new URL("../../ExamcureBe/dist/config.js", import.meta.url)
  .href;
const bootstrapToken = "isolated-proxy-bootstrap-secret-32-characters";
const fixture = await startMongoFixture();
const apiCode = `import {createApp} from ${JSON.stringify(appModule)};import {loadConfig} from ${JSON.stringify(configModule)};const config=loadConfig({NODE_ENV:'test',MONGODB_URI:${JSON.stringify(fixture.uri)},MONGODB_DATABASE:'examcure_proxy_test',JWT_SECRET:'isolated-proxy-secret-at-least-32-characters',CORS_ORIGIN:${JSON.stringify(base)}});const {app}=createApp(config,{otpSender:{async send(){}}});app.listen(${backendPort});`;
const api = spawn(process.execPath, ["--input-type=module", "-e", apiCode], {
  cwd: frontend,
  windowsHide: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    ADMIN_BOOTSTRAP_TOKEN: bootstrapToken,
    ADMIN_BOOTSTRAP_EXPIRES_AT: "2099-01-01T00:00:00Z",
  },
});
const next = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/next/dist/bin/next", import.meta.url),
    ),
    "start",
    "-p",
    String(port),
    "-H",
    "127.0.0.1",
  ],
  { cwd: frontend, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let output = "";
for (const child of [api, next])
  for (const stream of [child.stdout, child.stderr])
    stream.on("data", (data) => {
      output = (output + data).slice(-4000);
    });
const cookie = (response) =>
  response.headers
    .getSetCookie()
    .find((c) => c.startsWith("examcure_refresh="))
    ?.split(";")[0];
async function post(path, body = {}, headers = {}) {
  return fetch(base + "/api/v1" + path, {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (api.exitCode !== null || next.exitCode !== null)
      throw new Error(`Test server exited: ${output}`);
    try {
      const health = await fetch(base + "/api/v1/health");
      if (health.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await delay(200);
  }
  assert.ok(ready, `API rewrite must start: ${output}`);
  const registration = await post("/Auth/register", {
    email: "proxy@example.com",
    password: "proxy-password",
    fullName: "Proxy User",
  });
  assert.equal(registration.status, 201);
  const verified = await post("/Auth/verify-otp", {
    email: "proxy@example.com",
    code: (await registration.json()).otp,
  });
  assert.equal(verified.status, 200);
  const signedIn = await verified.json(),
    initialCookie = cookie(verified);
  assert.ok(initialCookie);
  assert.ok(
    verified.headers
      .getSetCookie()
      .some((c) => c.includes("HttpOnly") && c.includes("Path=/api/v1/Auth")),
  );
  assert.equal(signedIn.refreshToken, undefined);
  const me = await fetch(base + "/api/v1/Users/me", {
    headers: { Authorization: `Bearer ${signedIn.token}` },
  });
  assert.equal((await me.json()).role, "student");
  assert.equal(
    (
      await fetch(base + "/api/v1/Admin/overview", {
        headers: {
          Authorization: `Bearer ${signedIn.token}`,
          Cookie: "examcure_role=admin",
        },
      })
    ).status,
    403,
  );
  const grant = await post(
    "/Admin/bootstrap",
    { bootstrapToken },
    { Authorization: `Bearer ${signedIn.token}` },
  );
  assert.equal(grant.status, 201);
  assert.equal(
    (
      await fetch(base + "/api/v1/Admin/overview", {
        headers: { Authorization: `Bearer ${signedIn.token}` },
      })
    ).status,
    200,
  );
  const refreshed = await post("/Auth/refresh", {}, { Cookie: initialCookie });
  assert.equal(refreshed.status, 200);
  const renewed = await refreshed.json(),
    renewedCookie = cookie(refreshed);
  assert.ok(renewedCookie && renewedCookie !== initialCookie);
  assert.equal(
    (await post("/Auth/refresh", {}, { Cookie: initialCookie })).status,
    401,
  );
  assert.equal(
    (await post("/Auth/logout", {}, { Cookie: renewedCookie })).status,
    204,
  );
  assert.equal(
    (
      await fetch(base + "/api/v1/Admin/overview", {
        headers: { Authorization: `Bearer ${renewed.token}` },
      })
    ).status,
    401,
  );
  assert.equal(
    (await post("/Auth/refresh", {}, { Cookie: renewedCookie })).status,
    401,
  );
  console.log(
    "Production proxy passed: OTP/session cookies, admin checks, refresh replay and logout revocation.",
  );
} finally {
  for (const child of [next, api]) {
    child.kill();
    if (child.exitCode === null) {
      await Promise.race([
        new Promise((resolve) => child.once("exit", resolve)),
        delay(5000),
      ]);
      if (child.exitCode === null) child.kill("SIGKILL");
    }
  }
  await fixture.stop();
}
