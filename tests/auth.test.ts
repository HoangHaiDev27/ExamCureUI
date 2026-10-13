import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  };
}
const profile = {
  id: "user-123",
  fullName: "Student",
  email: "student@example.com",
  schoolId: "hust",
  role: "student",
  mssv: "",
};
beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    location: { origin: "https://examcure.example", assign: vi.fn() },
  });
  vi.stubGlobal("document", { cookie: "" });
  vi.stubGlobal("navigator", {});
  vi.stubGlobal("localStorage", storage());
  vi.stubGlobal("sessionStorage", storage());
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.endsWith("/Auth/logout")
        ? new Response(null, { status: 204 })
        : Response.json(
            url.endsWith("/Auth/refresh")
              ? { ...profile, token: "backend-token" }
              : profile,
          ),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());
describe("ExamcureBe browser authentication", () => {
  it.each([
    "/quen-mat-khau",
    "/xac-thuc-otp",
    "/",
    "/pricing",
    "/schools/fptu/subjects/CSD201",
    "/admin/noi-dung-ai",
  ])("keeps admin navigation unchanged on %s", async (path) => {
    const auth = await import("../lib/auth");
    expect(auth.adminLandingFor("admin", path)).toBeNull();
  });
  it("only redirects a verified admin dashboard landing", async () => {
    const auth = await import("../lib/auth");
    expect(auth.adminLandingFor("Admin", "/dashboard")).toBe("/admin");
    expect(auth.adminLandingFor("student", "/dashboard")).toBeNull();
  });
  it("restores sessions using an HttpOnly cookie and reads role from the backend", async () => {
    localStorage.setItem(
      "examcure:supabase-auth",
      JSON.stringify({ name: "Old Admin", role: "admin", token: "old-token" }),
    );
    const auth = await import("../lib/auth");
    expect(auth.getAuth()).toBeNull();
    await auth.refreshAuthProfile();
    expect(auth.getAuth()).toMatchObject({
      name: "Student",
      schoolId: "hust",
      role: "student",
      mssv: "",
    });
    expect(localStorage.getItem("examcure:supabase-auth")).toBeNull();
    expect(localStorage.getItem("examcure:profile")).not.toContain("token");
    const calls = vi.mocked(fetch).mock.calls;
    expect(calls[0][0]).toBe("/api/v1/Auth/refresh");
    expect(calls[0][1]?.credentials).toBe("include");
    expect(new Headers(calls[1][1]?.headers).get("Authorization")).toBe(
      "Bearer backend-token",
    );
  });
  it("stores neither access nor refresh tokens and clears old bootstrap credentials", async () => {
    sessionStorage.setItem("examcure:admin-bootstrap-token", "obsolete-secret");
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ...profile, token: "login-token" }),
    );
    const auth = await import("../lib/auth");
    await auth.loginAPI(profile.email, "password");
    expect(await auth.getAccessToken()).toBe("login-token");
    expect(localStorage.getItem("examcure:profile")).not.toContain("token");
    expect(sessionStorage.getItem("examcure:admin-bootstrap-token")).toBeNull();
    expect(document.cookie).toContain("examcure_role=; path=/; max-age=0");
  });
  it("updates promotion and demotion while retaining the session", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "session-token", role: "student" });
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ...profile, role: "admin" }),
    );
    await auth.refreshAuthProfile();
    expect(auth.getAuth()?.role).toBe("admin");
    await auth.refreshAuthProfile();
    expect(auth.getAuth()?.role).toBe("student");
    expect(await auth.getAccessToken()).toBe("session-token");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("ignores an older role read that completes after a newer demotion", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", token: "session-token", role: "admin" });
    let complete!: (v: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const old = auth.refreshAuthProfile();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await auth.refreshAuthProfile();
    complete(Response.json({ ...profile, role: "admin" }));
    expect(await old).toBeNull();
    expect(auth.getAuth()?.role).toBe("student");
  });
  it("never resurrects an admin profile that completes after logout", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", token: "session-token", role: "admin" });
    let complete!: (v: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const pending = auth.refreshAuthProfile();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    await auth.logout();
    complete(Response.json({ ...profile, role: "admin" }));
    expect(await pending).toBeNull();
    expect(auth.getAuth()).toBeNull();
  });
  it("hides cached admin data if a role check fails", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", token: "session-token", role: "admin" });
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await expect(auth.refreshAuthProfile()).rejects.toThrow("offline");
    expect(auth.getAuth()).toBeNull();
    expect(await auth.getAccessToken()).toBe("session-token");
  });
  it("treats missing cookie sessions as anonymous without a false login", async () => {
    const auth = await import("../lib/auth");
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ message: "No session" }, { status: 401 }),
    );
    expect(await auth.refreshAuthProfile()).toBeNull();
    expect(auth.getAuth()).toBeNull();
  });
  it("shares a single refresh between simultaneous API requests", async () => {
    const auth = await import("../lib/auth");
    let complete!: (v: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const first = auth.getAccessToken(true),
      second = auth.getAccessToken(true);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    complete(Response.json({ ...profile, token: "renewed" }));
    expect(await Promise.all([first, second])).toEqual(["renewed", "renewed"]);
  });
  it("blocks calls during signout and sends no refresh credential in JSON", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "session-token" });
    let complete!: (v: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const pending = auth.logout();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(auth.getAuth()).toBeNull();
    await expect(auth.getAccessToken()).rejects.toThrow("đăng nhập");
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBe("{}");
    complete(new Response(null, { status: 204 }));
    await pending;
    expect(localStorage.getItem("examcure:logout-pending")).toBeNull();
  });
  it("keeps logout pending after a network failure and retries revocation before restoring anything", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", token: "session-token", role: "admin" });
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await expect(auth.logout()).rejects.toThrow("offline");
    expect(localStorage.getItem("examcure:logout-pending")).toBe("true");
    expect(await auth.refreshAuthProfile()).toBeNull();
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("/api/v1/Auth/logout");
    expect(auth.getAuth()).toBeNull();
  });
  it("invalidates in-memory tokens after a cross-tab session change", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "old-token" });
    const sharedProfile = localStorage.getItem("examcure:profile");
    auth.invalidateSession();
    expect(localStorage.getItem("examcure:profile")).toBe(sharedProfile);
    expect(await auth.getAccessToken()).toBe("backend-token");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("ignores an old profile read after logging in as another account", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Old Admin", token: "old-token", role: "admin" });
    let complete!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const pending = auth.refreshAuthProfile();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ...profile, token: "new-token" }),
    );
    await auth.loginAPI(profile.email, "password");
    complete(
      Response.json({ ...profile, fullName: "Old Admin", role: "admin" }),
    );
    expect(await pending).toBeNull();
    expect(auth.getAuth()?.role).toBe("student");
    expect(await auth.getAccessToken()).toBe("new-token");
  });
  it("retains a verified display profile when browser storage is unavailable", async () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    });
    const auth = await import("../lib/auth");
    await auth.refreshAuthProfile();
    expect(auth.getAuth()).toMatchObject({ name: "Student", role: "student" });
    expect(await auth.getAccessToken()).toBe("backend-token");
  });
  it("registers for OTP verification and never creates an active session prematurely", async () => {
    const auth = await import("../lib/auth");
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ success: true }));
    expect(
      (await auth.registerAPI("Student", profile.email, "password", "hust"))
        .user,
    ).toBeNull();
    expect(auth.getAuth()).toBeNull();
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string),
    ).toMatchObject({ fullName: "Student", schoolId: "hust" });
  });
  it("never turns backend/network errors into successful logins", async () => {
    const auth = await import("../lib/auth");
    vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
    await expect(auth.loginAPI(profile.email, "password")).rejects.toThrow(
      "offline",
    );
    expect(auth.getAuth()).toBeNull();
  });
  it("resetting a password uses the backend OTP flow and leaves no recovery session", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", role: "admin", token: "old-token" });
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ success: true }));
    await auth.resetPasswordWithOtpAPI(profile.email, "123456", "new-password");
    expect(auth.getAuth()).toBeNull();
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      "/api/v1/Auth/reset-password",
    );
  });
  it("uses the backend Google redirect and rejects external destinations", async () => {
    const auth = await import("../lib/auth");
    await expect(auth.signInWithGoogle("https://evil.example")).rejects.toThrow(
      "không hợp lệ",
    );
    await auth.signInWithGoogle("/dashboard");
    const redirect = vi.mocked(window.location.assign).mock
      .calls[0][0] as string;
    expect(redirect).toContain("/api/v1/Auth/google/start?returnTo=");
    expect(decodeURIComponent(redirect)).toContain(
      "https://examcure.example/auth/callback?next=",
    );
  });
});
