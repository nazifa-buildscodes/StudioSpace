
export const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "creator" | "host" | "admin";
  photoURL?: string;
  phone?: string;
  whatsapp?: string;
  status?: "active" | "suspended";
};
export async function request(
  path: string,
  options: RequestInit = {}
) {
  const headers = new Headers(options.headers || {});

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// Update the display-only user data and notify other components.
export function updateStoredUser(user: User) {
  if (typeof window === "undefined") return;

  localStorage.setItem("studiospace_user", JSON.stringify(user));
  window.dispatchEvent(new Event("studiospace:user-updated"));
}

export function saveSession(data: { user: User }) {
  updateStoredUser(data.user);
}

export function currentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("studiospace_user") || "null"
    );
  } catch {
    return null;
  }
}

export async function refreshCurrentUser(): Promise<User> {
  const data = await request("/api/auth/me");
  updateStoredUser(data.user);
  return data.user as User;
}

export async function logout() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("studiospace_user");
    window.dispatchEvent(new Event("studiospace:user-updated"));
    window.location.href = "/";
  }
}
