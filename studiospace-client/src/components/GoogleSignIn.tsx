
"use client";

import { useEffect, useState, useRef } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { request, saveSession } from "../lib/api";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string>
          ) => void;
        };
      };
    };
  }
}

export default function GoogleSignIn() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!scriptLoaded || !clientId || !window.google || !buttonRef.current) {
      return;
    }

    buttonRef.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          const data = await request("/api/auth/google", {
            method: "POST",
            body: JSON.stringify({
              credential: response.credential,
            }),
          });

          saveSession(data);

          toast.success("Signed in with Google");

          router.push(
            data.user.role === "admin" ? "/admin" : "/dashboard"
          );
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Google sign-in failed"
          );
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      text: "continue_with",
      width: "320",
    });
  }, [scriptLoaded, clientId, router]);

  if (!clientId) {
    return (
      <p className="small text-muted">
        Google sign-in requires NEXT_PUBLIC_GOOGLE_CLIENT_ID configuration.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div ref={buttonRef} />
    </>
  );
}
