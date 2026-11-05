
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      if (result.user?.role !== "admin") {
        throw new Error("Access denied. Admin account required.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080b12] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
        <p className="text-sm font-semibold tracking-[0.25em] text-cyan-400">
          STUDIOSPACE
        </p>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Admin Portal
        </h1>

        <p className="mt-2 text-sm text-gray-400">
          Sign in to manage your StudioSpace platform.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-black transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In to Admin"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Authorized administrators only.
        </p>
      </div>
    </main>
  );
}
