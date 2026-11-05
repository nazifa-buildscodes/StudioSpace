
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import {
  currentUser,
  refreshCurrentUser,
  request,
  updateStoredUser,
  type User,
} from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState("");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!currentUser()) {
      router.replace("/login");
      return;
    }

    refreshCurrentUser()
      .then((u) => {
        setUser(u);
        setName(u.name || "");
        setPhotoURL(u.photoURL || "");
        setPhone(u.phone || "");
        setWhatsapp(u.whatsapp || "");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewURL("");
      return;
    }

    const objectURL = URL.createObjectURL(selectedFile);
    setPreviewURL(objectURL);

    return () => URL.revokeObjectURL(objectURL);
  }, [selectedFile]);

  function choosePhoto(file?: File) {
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

    setSelectedFile(file);
    setRemovePhoto(false);
  }

  async function uploadPhoto(file: File): Promise<string> {
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read image"));
        }
      };

      reader.onerror = () => reject(new Error("Could not read image"));

      reader.readAsDataURL(file);
    });

    const result = await request("/api/upload/profile-photo", {
      method: "POST",
      body: JSON.stringify({ imageData }),
    });

    if (!result.photoURL) {
      throw new Error("Image upload failed");
    }

    return result.photoURL;
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (name.trim().length < 2) {
      toast.error("Name must contain at least 2 characters");
      return;
    }

    setBusy(true);

    try {
      let finalPhotoURL = photoURL;

      if (selectedFile) {
        finalPhotoURL = await uploadPhoto(selectedFile);
      } else if (removePhoto) {
        finalPhotoURL = "";
      }

      const data = await request("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          photoURL: finalPhotoURL,
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
        }),
      });

      updateStoredUser(data.user);
      setUser(data.user);
      setPhotoURL(data.user.photoURL || "");
      setSelectedFile(null);
      setRemovePhoto(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not update profile"
      );
    } finally {
      setBusy(false);
    }
  }

  const displayedPhoto = previewURL || (
    removePhoto ? "" : photoURL
  );

  return (
    <PageFrame
      title="My profile"
      subtitle="Manage your StudioSpace account information."
    >
      <form className="form-card auth-card" onSubmit={save}>
        <div className="profile-summary">
          {displayedPhoto ? (
            <img
              src={displayedPhoto}
              alt="Profile"
              style={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="avatar-large">
              {name?.[0] || "U"}
            </div>
          )}

          <div>
            <h2>{name || "Your profile"}</h2>
            <p className="text-muted">{user?.email}</p>
            <span className="pill">{user?.role || "Account"}</span>
          </div>
        </div>

        <label>
          Profile Photo
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => choosePhoto(e.target.files?.[0])}
          />
          <span className="small text-muted">
            JPG, PNG or WEBP · Maximum 5MB
          </span>
        </label>

        {selectedFile && (
          <p className="small text-muted">
            Selected: {selectedFile.name}
          </p>
        )}

        {(photoURL || selectedFile) && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSelectedFile(null);
              setRemovePhoto(true);
            }}
          >
            Remove profile photo
          </button>
        )}

        <label>
          Full name
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label>
          Phone Number
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label>
          WhatsApp Number
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </label>

        <label>
          Email
          <input value={user?.email || ""} readOnly />
        </label>

        <label>
          Account role
          <input value={user?.role || ""} readOnly />
        </label>

        <button className="btn-primary full" disabled={busy}>
          {busy
            ? "Uploading and saving…"
            : "Save profile"}
        </button>
      </form>
    </PageFrame>
  );
}
