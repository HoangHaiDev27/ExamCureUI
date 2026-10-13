import { API_BASE_URL, clearAuthCache, getAccessToken, refreshAuthProfile } from "./auth";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type ApiOptions = { authenticated?: boolean; token?: string };

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  { authenticated = true, token }: ApiOptions = {},
): Promise<T> {
  const send = async (accessToken?: string) => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    try {
      return await fetch(`${API_BASE_URL}${path}`, { ...init, credentials: "include", cache: "no-store", headers });
    } catch (error) {
      if (init.signal?.aborted) throw error;
      throw new ApiError(0, "Không kết nối được máy chủ. Vui lòng thử lại.");
    }
  };
  let response = await send(token || (authenticated ? await getAccessToken() : undefined));
  if (response.status === 401 && authenticated && !token) {
    let refreshed: string;
    try {
      refreshed = await getAccessToken(true);
    } catch {
      clearAuthCache();
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    response = await send(refreshed);
    if (response.status === 401) clearAuthCache();
  }
  const data = await response.json().catch(() => null);
  if (response.status === 403 && authenticated && !token) {
    await refreshAuthProfile().catch(() => undefined);
  }
  if (!response.ok) {
    const message = data?.message || data?.error;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(" · ") : message || `Yêu cầu thất bại (${response.status}).`);
  }
  return data as T;
}
