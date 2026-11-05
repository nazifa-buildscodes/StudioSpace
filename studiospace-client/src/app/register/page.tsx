
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import { request, saveSession } from "../../lib/api";
import GoogleSignIn from "../../components/GoogleSignIn";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "creator",
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  function change(key: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function selectPhoto(file?: File) {
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG or WEBP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setPhoto(file);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setBusy(true);

    try {
      let photoURL = "";

      // Upload selected photo to ImgBB through backend
      if (photo) {
        const imageData = await new Promise<string>(
          (resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result === "string") {
                resolve(reader.result);
              } else {
                reject(new Error("Could not read selected image"));
              }
            };

            reader.onerror = () => {
              reject(new Error("Could not read selected image"));
            };

            reader.readAsDataURL(photo);
          }
        );

        const upload = await request("/api/upload/profile-photo", {
          method: "POST",
          body: JSON.stringify({ imageData }),
        });

        photoURL = upload.photoURL;
      }

      // Create account with uploaded photo URL
      const data = await request("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          photoURL,
        }),
      });

      saveSession(data);

      toast.success("Account created successfully");

      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Registration failed"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame
      title="Create your account"
      subtitle="Join a community built for creative workspaces."
    >
      <form
        className="form-card auth-card"
        onSubmit={submit}
      >
        <label>
          Full name
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </label>

        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => change("email", e.target.value)}
          />
        </label>

        <label>
          Profile Photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => selectPhoto(e.target.files?.[0])}
          />
        </label>

        {preview && (
          <div style={{ textAlign: "center", margin: "12px 0" }}>
            <img
              src={preview}
              alt="Selected profile preview"
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #7dbb2a",
              }}
            />
            <p className="small text-muted">
              Selected profile photo
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setPhoto(null)}
            >
              Remove photo
            </button>
          </div>
        )}

        <label>
          Password
          <input
            type="password"
            minLength={6}
            required
            value={form.password}
            onChange={(e) => change("password", e.target.value)}
            placeholder="Uppercase + lowercase, 6+ characters"
          />
        </label>

        <label>
          Account type
          <select
            value={form.role}
            onChange={(e) => change("role", e.target.value)}
          >
            <option value="creator">
              Creator — book studios
            </option>
            <option value="host">
              Host — list my studio
            </option>
          </select>
        </label>

        <button
          className="btn-primary full"
          disabled={busy}
        >
          {busy
            ? photo
              ? "Uploading photo and creating account…"
              : "Creating account…"
            : "Create account"}
        </button>

        <div className="divider-text">
          or sign up with
        </div>

        <GoogleSignIn />

        <p className="small text-muted">
          Already registered? <Link href="/login">Login</Link>
        </p>
      </form>
    </PageFrame>
  );
}
