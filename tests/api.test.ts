import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getAccessToken: vi.fn(), clearAuthCache: vi.fn(), refreshAuthProfile: vi.fn() }));
vi.mock("../lib/auth", () => ({ API_BASE_URL: "https://backend.example/api/v1", ...auth }));
import { apiRequest } from "../lib/api";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  auth.getAccessToken.mockImplementation(async (refresh?: boolean) => refresh ? "new-token" : "current-token");
  auth.refreshAuthProfile.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllGlobals());

describe("authenticated backend requests", () => {
  it("retries once with the refreshed Supabase token after 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ message: "expired" }, { status: 401 }))
      .mockResolvedValueOnce(Response.json({ materials: [] }));
    expect(await apiRequest("/Materials")).toEqual({ materials: [] });
    expect(auth.getAccessToken.mock.calls).toEqual([[], [true]]);
    const calls = vi.mocked(fetch).mock.calls;
    expect(new Headers(calls[0][1]?.headers).get("Authorization")).toBe("Bearer current-token");
    expect(new Headers(calls[1][1]?.headers).get("Authorization")).toBe("Bearer new-token");
  });

  it("stops after a second 401 and clears only invalid cached login state", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ message: "unauthorized" }, { status: 401 }));
    await expect(apiRequest("/Materials")).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(auth.clearAuthCache).toHaveBeenCalledTimes(1);
  });

  it("does not retry requests when session refresh fails", async () => {
    auth.getAccessToken.mockResolvedValueOnce("expired").mockRejectedValueOnce(new Error("no session"));
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 401 }));
    await expect(apiRequest("/Materials")).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(auth.clearAuthCache).toHaveBeenCalledTimes(1);
  });

  it.each([403, 500])("preserves a valid session for HTTP %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ message: "failed" }, { status }));
    await expect(apiRequest("/Admin/overview")).rejects.toMatchObject({ status });
    expect(auth.getAccessToken).toHaveBeenCalledTimes(1);
    expect(auth.clearAuthCache).not.toHaveBeenCalled();
    expect(auth.refreshAuthProfile).toHaveBeenCalledTimes(status === 403 ? 1 : 0);
  });

  it("does not refresh explicitly supplied bearer tokens", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({}, { status: 401 }));
    await expect(apiRequest("/Admin/overview", {}, { token: "explicit-token" })).rejects.toMatchObject({ status: 401 });
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(auth.clearAuthCache).not.toHaveBeenCalled();
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).get("Authorization")).toBe("Bearer explicit-token");
  });

  it("can read public status without a Supabase session", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ services: {} }));
    await apiRequest("/System/status", {}, { authenticated: false });
    expect(auth.getAccessToken).not.toHaveBeenCalled();
    expect(new Headers(vi.mocked(fetch).mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
  });

  it("preserves cancellation instead of reporting it as an unavailable server", async () => {
    const controller = new AbortController();
    controller.abort();
    const reason = new DOMException("Cancelled", "AbortError");
    vi.mocked(fetch).mockRejectedValue(reason);
    await expect(apiRequest("/Materials", { signal: controller.signal })).rejects.toBe(reason);
    expect(auth.clearAuthCache).not.toHaveBeenCalled();
  });
});
