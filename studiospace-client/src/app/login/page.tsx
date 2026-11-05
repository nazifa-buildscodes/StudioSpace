
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import GoogleSignIn from "../../components/GoogleSignIn";
import {
  request,
  saveSession,
  currentUser,
  refreshCurrentUser,
} from "../../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const existingUser = currentUser();

        if (existingUser) {
          const updatedUser = await refreshCurrentUser();

          if (active && updatedUser) {
            router.replace(
              updatedUser.role === "admin" ? "/admin" : "/dashboard"
            );
            return;
          }
        }
      } catch {
        // Invalid or expired session: remain on login page.
      }

      if (active) setChecking(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, [router]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);

    try {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      saveSession(data);

      toast.success("Welcome back!");

      router.replace(
        data.user.role === "admin" ? "/admin" : "/dashboard"
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Login failed"
      );
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <PageFrame
        title="Checking your account"
        subtitle="Please wait..."
      >
        <div className="form-card auth-card">
          <p className="text-muted">Checking login session...</p>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title="Welcome back"
      subtitle="Sign in to continue creating something great."
    >
      <form className="form-card auth-card" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </label>

        <button className="btn-primary full" disabled={busy}>
          {busy ? "Signing in…" : "Login"}
        </button>

        <div className="divider-text">or continue with</div>

        <GoogleSignIn />

        <p className="text-muted small">
          New to StudioSpace? <Link href="/register">Create an account</Link>
        </p>
      </form>
    </PageFrame>
  );
}
