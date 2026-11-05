
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import { request, currentUser } from "../../lib/api";

export default function AddStudio() {
  const router = useRouter();

  const [f, setF] = useState<any>({
    title: "",
    category: "Photography",
    hourlyRate: "",
    securityDeposit: "0",
    maxCapacity: "2",
    location: "",
    amenities: "",
    description: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [busy, setBusy] = useState(false);

  function set(k: string, v: string) {
    setF((p: any) => ({ ...p, [k]: v }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      e.target.value = "";
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser()) {
      toast.error("Login required");
      router.push("/login");
      return;
    }

    if (!imageFile) {
      toast.error("Please select a studio image");
      return;
    }

    setBusy(true);

    try {
      // Convert selected image to Base64
      const reader = new FileReader();

      const imageData: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Image reading failed"));
        reader.readAsDataURL(imageFile);
      });

      // Upload image to ImgBB using existing profile upload API
      const upload = await request("/api/upload/profile-photo", {
        method: "POST",
        body: JSON.stringify({ imageData }),
      });

      if (!upload.photoURL) {
        throw new Error("Image upload failed");
      }

      // Create studio with uploaded image URL
      const d = await request("/api/studios", {
        method: "POST",
        body: JSON.stringify({
          ...f,
          image: upload.photoURL,
          amenities: f.amenities
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean),
          hourlyRate: Number(f.hourlyRate),
          securityDeposit: Number(f.securityDeposit),
          maxCapacity: Number(f.maxCapacity),
        }),
      });

      toast.success(d.message || "Studio submitted successfully");
      router.push("/my-listings");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not create listing"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageFrame
      title="List your creative space"
      subtitle="Share your studio with creators looking for their next workspace."
    >
      <form className="form-card wide-form" onSubmit={submit}>
        <div className="form-grid">
          {[
            ["title", "Studio title"],
            ["hourlyRate", "Hourly rate (৳)"],
            ["securityDeposit", "Security deposit (৳)"],
            ["maxCapacity", "Maximum capacity"],
            ["location", "Location"],
          ].map(([k, label]) => (
            <label key={k}>
              {label}
              <input
                required
                value={f[k]}
                type={
                  ["hourlyRate", "securityDeposit", "maxCapacity"].includes(k)
                    ? "number"
                    : "text"
                }
                min={
                  ["hourlyRate", "securityDeposit", "maxCapacity"].includes(k)
                    ? 0
                    : undefined
                }
                onChange={(e) => set(k, e.target.value)}
              />
            </label>
          ))}

          <label>
            Category
            <select
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {[
                "Photography",
                "Film Studio",
                "Podcast Studio",
                "Music Studio",
                "Art Studio",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>

          <label>
            Amenities <span className="text-muted">(comma separated)</span>
            <input
              value={f.amenities}
              onChange={(e) => set("amenities", e.target.value)}
              placeholder="Softbox, AC, Parking"
            />
          </label>
        </div>

        {/* Studio Image Upload */}
        <div className="mt-5">
          <label className="block font-semibold mb-2">
            Studio Image *
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="w-full rounded-xl border border-white/10 p-3"
          />

          <p className="text-sm text-muted mt-2">
            Select an image from your device. JPG, PNG or WEBP (Max 5MB).
          </p>

          {imagePreview && (
            <div className="mt-4">
              <p className="font-medium mb-2">Image Preview</p>
              <img
                src={imagePreview}
                alt="Studio preview"
                className="w-full max-w-md h-56 object-cover rounded-xl border border-white/10"
              />
              <button
                type="button"
                className="text-button danger mt-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview("");
                }}
              >
                Remove image
              </button>
            </div>
          )}
        </div>

        <label className="block mt-5">
          Description
          <textarea
            required
            rows={5}
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>

        <button className="btn-primary mt-4" disabled={busy}>
          {busy ? "Uploading image & submitting..." : "Submit for approval"}
        </button>

        <p className="small text-muted mt-3">
          Your listing will be visible publicly after admin approval.
        </p>
      </form>
    </PageFrame>
  );
}
