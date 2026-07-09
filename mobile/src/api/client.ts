import { Platform } from "react-native";

// Android emulators reach the host machine at 10.0.2.2, not localhost.
// iOS simulators and web can use localhost directly.
const DEV_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL = `http://${DEV_HOST}:8080/api`;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? "Something went wrong");
  }

  return body as T;
}

export interface LoginResponse {
  token: string;
  must_change_password: boolean;
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export interface ChangePasswordResponse {
  token: string;
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
  token: string
): Promise<ChangePasswordResponse> {
  return request<ChangePasswordResponse>(
    "/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
    token
  );
}

export interface CreateInviteResponse {
  invite_link: string;
}

export function createInvite(email: string, authToken: string): Promise<CreateInviteResponse> {
  return request<CreateInviteResponse>(
    "/invites",
    { method: "POST", body: JSON.stringify({ email }) },
    authToken
  );
}

export interface InviteInfoResponse {
  email: string;
}

export function getInvite(inviteToken: string): Promise<InviteInfoResponse> {
  return request<InviteInfoResponse>(`/invites/${encodeURIComponent(inviteToken)}`);
}

export interface AcceptInviteResponse {
  token: string;
  must_change_password: boolean;
}

export function acceptInvite(
  inviteToken: string,
  name: string,
  password: string
): Promise<AcceptInviteResponse> {
  return request<AcceptInviteResponse>(`/invites/${encodeURIComponent(inviteToken)}/accept`, {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}
