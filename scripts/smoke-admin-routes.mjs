import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// Run after `npm run build`. Test the actual production router without touching
// external services or requiring account credentials, including obsolete role cookies.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, "127.0.0.1", resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "start", "-p", String(port), "-H", "127.0.0.1"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (data) => { output = (output + data).slice(-4000); });
server.stderr.on("data", (data) => { output = (output + data).slice(-4000); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Next server exited: ${output}`);
    try { await fetch(base); ready = true; break; }
    catch { await delay(200); }
  }
  assert.ok(ready, `Next server must start: ${output}`);
  for (const cookie of ["", "examcure_role=admin", "examcure_role=student"]) {
    for (const route of ["/quen-mat-khau", "/xac-thuc-otp", "/pricing", "/admin/noi-dung-ai"]) {
      const response = await fetch(base + route, { headers: { cookie }, redirect: "manual" });
      assert.equal(response.status, 200, `${route} with ${cookie || "no cookie"} must not redirect`);
      assert.equal(response.headers.get("location"), null);
      if (route.startsWith("/admin")) {
        const html = await response.text();
        assert.ok(html.includes("Đang kiểm tra quyền truy cập"), "admin UI must wait for profile verification");
        assert.ok(!html.includes("Pipeline tài liệu và tạo đề"), "unverified SSR must not render the admin console");
      }
    }
    const admin = await fetch(base + "/admin", { headers: { cookie }, redirect: "manual" });
    assert.equal(admin.status, 307);
    assert.equal(new URL(admin.headers.get("location"), base).pathname, "/admin/noi-dung-ai");
  }
  console.log("Admin routes passed: recovery/public routes ignore stale cookies; admin waits for verification.");
} finally {
  server.kill();
  if (server.exitCode === null) {
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(5000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
}
