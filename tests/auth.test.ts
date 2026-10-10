import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  configured: true,
  auth: {
    getSession: vi.fn(), refreshSession: vi.fn(), signOut: vi.fn(),
    signInWithPassword: vi.fn(), signUp: vi.fn(), verifyOtp: vi.fn(),
    resend: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(),
    signInWithOAuth: vi.fn(),
  },
  maybeSingle: vi.fn(),
}));

vi.mock("../lib/supabase-browser", () => ({
  isSupabaseBrowserConfigured: () => sdk.configured,
  getSupabaseBrowserClient: () => {
    if (!sdk.configured) throw new Error("Supabase chưa được cấu hình trên trình duyệt.");
    const query = { select: () => query, eq: () => query, maybeSingle: sdk.maybeSingle };
    return { auth: sdk.auth, from: () => query };
  },
}));

const session = {
  access_token: "supabase-access-token",
  refresh_token: "sdk-refresh-token",
  user: { id: "user-123", email: "student@example.com", user_metadata: { full_name: "Student", role: "admin" } },
};

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.resetAllMocks();
  sdk.configured = true;
  vi.stubGlobal("window", { dispatchEvent: vi.fn(), location: { origin: "https://examcure.example" } });
  vi.stubGlobal("document", { cookie: "" });
  vi.stubGlobal("localStorage", storage());
  vi.stubGlobal("sessionStorage", storage());
  vi.stubGlobal("fetch", vi.fn());
  sdk.auth.getSession.mockResolvedValue({ data: { session }, error: null });
  sdk.auth.signOut.mockResolvedValue({ error: null });
  sdk.maybeSingle.mockResolvedValue({ data: { full_name: "Student", school_id: "hust", role: "student" }, error: null });
});

afterEach(() => vi.unstubAllGlobals());

describe("Supabase authentication", () => {
  it.each(["/quen-mat-khau", "/xac-thuc-otp", "/", "/pricing", "/schools/fptu/subjects/CSD201", "/admin/noi-dung-ai"])("keeps an admin on %s instead of forcing admin navigation", async (pathname) => {
    const auth = await import("../lib/auth");
    expect(auth.adminLandingFor("admin", pathname)).toBeNull();
  });

  it("routes only the verified admin dashboard landing to admin", async () => {
    const auth = await import("../lib/auth");
    expect(auth.adminLandingFor("Admin", "/dashboard")).toBe("/admin");
    expect(auth.adminLandingFor("student", "/dashboard")).toBeNull();
    expect(auth.adminLandingFor(undefined, "/dashboard")).toBeNull();
  });

  it("refreshes promotions and demotions without logging out the SDK session", async () => {
    const auth = await import("../lib/auth");
    sessionStorage.setItem("examcure:admin-bootstrap-token", "obsolete-secret");
    auth.login({ name: "Student", role: "student" });
    expect(sessionStorage.getItem("examcure:admin-bootstrap-token")).toBeNull();
    sdk.maybeSingle.mockResolvedValueOnce({ data: { full_name: "Admin", role: "admin" }, error: null });
    await auth.refreshAuthProfile();
    expect(auth.getAuth()?.role).toBe("admin");
    expect(document.cookie).toContain("examcure_role=; path=/; max-age=0");
    await auth.refreshAuthProfile();
    expect(auth.getAuth()?.role).toBe("student");
    expect(sdk.auth.signOut).not.toHaveBeenCalled();
    expect(await auth.getAccessToken()).toBe(session.access_token);
  });

  it("ignores an older admin profile read after a newer demotion read", async () => {
    let complete!: (value: unknown) => void;
    sdk.maybeSingle.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    const old = auth.refreshAuthProfile();
    await vi.waitFor(() => expect(sdk.maybeSingle).toHaveBeenCalledTimes(1));
    await auth.refreshAuthProfile();
    complete({ data: { role: "admin" }, error: null });
    expect(await old).toBeNull();
    expect(auth.getAuth()?.role).toBe("student");
  });

  it("does not restore an admin cache when a refresh completes after logout", async () => {
    let complete!: (value: unknown) => void;
    sdk.maybeSingle.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    const pending = auth.refreshAuthProfile();
    await vi.waitFor(() => expect(sdk.maybeSingle).toHaveBeenCalled());
    await auth.logout();
    complete({ data: { role: "admin" }, error: null });
    expect(await pending).toBeNull();
    expect(auth.getAuth()).toBeNull();
  });

  it("hides a stale admin profile if the database role cannot be checked", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Admin", role: "admin" });
    sdk.maybeSingle.mockResolvedValue({ data: null, error: new Error("offline") });
    await expect(auth.refreshAuthProfile()).rejects.toThrow("hồ sơ");
    expect(auth.getAuth()).toBeNull();
    expect(sdk.auth.signOut).not.toHaveBeenCalled();
  });

  it("fails explicitly when Supabase is missing instead of calling legacy auth or accepting a mock login", async () => {
    sdk.configured = false;
    const auth = await import("../lib/auth");
    await expect(auth.loginAPI("student@example.com", "password")).rejects.toThrow("chưa được cấu hình");
    await expect(auth.registerAPI("Student", "student@example.com", "password", "hust")).rejects.toThrow("chưa được cấu hình");
    expect(fetch).not.toHaveBeenCalled();
    expect(auth.getAuth()).toBeNull();
  });

  it("does not turn network errors into successful logins", async () => {
    sdk.auth.signInWithPassword.mockRejectedValue(new TypeError("fetch failed"));
    const auth = await import("../lib/auth");
    await expect(auth.loginAPI("student@example.com", "password")).rejects.toThrow("fetch failed");
    expect(auth.getAuth()).toBeNull();
  });

  it("ignores legacy cache and takes role from profiles rather than editable user metadata", async () => {
    localStorage.setItem("examcure:auth", JSON.stringify({ token: "mock-token", role: "admin" }));
    const auth = await import("../lib/auth");
    expect(auth.getAuth()).toBeNull();
    const user = await auth.authUserFromSupabaseSession();
    expect(user).toMatchObject({ id: "user-123", token: session.access_token, schoolId: "hust", role: "student" });
    auth.login(user!);
    expect(localStorage.getItem("examcure:auth")).toBeNull();
    expect(localStorage.getItem("examcure:supabase-auth")).not.toContain(session.refresh_token);
  });

  it("uses the SDK token even when the display cache has an outdated token", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "outdated-cache-token" });
    expect(await auth.getAccessToken()).toBe(session.access_token);
  });

  it("clears stale login state when the SDK has no session", async () => {
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "cached" });
    sdk.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await expect(auth.getAccessToken()).rejects.toThrow("đăng nhập");
    expect(auth.getAuth()).toBeNull();
  });

  it("shares a single refresh when simultaneous requests receive 401", async () => {
    let complete!: (value: unknown) => void;
    sdk.auth.refreshSession.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    const first = auth.getAccessToken(true);
    const second = auth.getAccessToken(true);
    complete({ data: { session: { ...session, access_token: "refreshed" } }, error: null });
    expect(await Promise.all([first, second])).toEqual(["refreshed", "refreshed"]);
    expect(sdk.auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("awaits SDK logout, clears bootstrap credentials and blocks requests during sign-out", async () => {
    let complete!: (value: unknown) => void;
    sdk.auth.signOut.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    auth.login({ name: "Student", token: "cached" });
    sessionStorage.setItem("examcure:admin-bootstrap-token", "bootstrap");
    const result = auth.logout();
    expect(auth.getAuth()).toBeNull();
    expect(sessionStorage.getItem("examcure:admin-bootstrap-token")).toBeNull();
    await expect(auth.getAccessToken()).rejects.toThrow("đăng nhập");
    complete({ error: null });
    await result;
    expect(sdk.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("does not resurrect a session from a profile read that completes after logout", async () => {
    let complete!: (value: unknown) => void;
    sdk.maybeSingle.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    const pending = auth.authUserFromSupabaseSession();
    await vi.waitFor(() => expect(sdk.maybeSingle).toHaveBeenCalled());
    await auth.logout();
    complete({ data: { role: "admin" }, error: null });
    expect(await pending).toBeNull();
  });

  it("completes local logout when remote revocation fails but the SDK cleared its session", async () => {
    sdk.auth.signOut.mockResolvedValue({ error: new Error("network unavailable") });
    sdk.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const auth = await import("../lib/auth");
    await expect(auth.logout()).resolves.toBeUndefined();
    expect(auth.getAuth()).toBeNull();
  });

  it("handles registrations with confirmation enabled and disabled", async () => {
    const auth = await import("../lib/auth");
    sdk.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect((await auth.registerAPI("Student", "student@example.com", "password", "hust")).user).toBeNull();
    sdk.auth.signUp.mockResolvedValue({ data: { session }, error: null });
    expect((await auth.registerAPI("Student", "student@example.com", "password", "hust")).user).toMatchObject({ schoolId: "hust", role: "student" });
  });

  it("keeps recovery sessions out of the application and clears them even when password update fails", async () => {
    let complete!: (value: unknown) => void;
    sdk.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
    sdk.auth.updateUser.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    const auth = await import("../lib/auth");
    const resetting = auth.resetPasswordWithOtpAPI("student@example.com", "123456", "new-password");
    const rejected = expect(resetting).rejects.toThrow("weak password");
    await vi.waitFor(() => expect(sdk.auth.updateUser).toHaveBeenCalled());
    expect(await auth.authUserFromSupabaseSession()).toBeNull();
    await expect(auth.getAccessToken()).rejects.toThrow("đăng nhập");
    complete({ error: new Error("weak password") });
    await rejected;
    expect(sdk.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(auth.getAuth()).toBeNull();
  });

  it("rejects external OAuth destinations", async () => {
    const auth = await import("../lib/auth");
    await expect(auth.signInWithGoogle("https://other.example/")).rejects.toThrow("không hợp lệ");
    expect(sdk.auth.signInWithOAuth).not.toHaveBeenCalled();
  });
});
