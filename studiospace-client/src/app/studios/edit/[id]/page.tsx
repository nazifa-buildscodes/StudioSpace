"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageFrame from "../../../../components/PageFrame";
import { request, currentUser } from "../../../../lib/api";
import { toast } from "sonner";

function EditStudioContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [f, setF] = useState<any>(null);

  useEffect(() => {
    if (!currentUser()) {
      router.replace("/login");
      return;
    }

    request("/api/my/studios")
      .then((d) => {
        const found = d.data.find((x: any) => x._id === id);

        if (!found) {
          toast.error("Listing not found or access denied");
          router.replace("/my-listings");
        } else {
          setF({
            ...found,
            amenities: (found.amenities || []).join(", "),
          });
        }
      })
      .catch(() => router.replace("/login"));
  }, [id, router]);

  function set(k: string, v: string) {
    setF((p: any) => ({ ...p, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await request(`/api/studios/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...f,
          amenities: f.amenities
            .split(",")
            .map((x: string) => x.trim())
            .filter(Boolean),
          hourlyRate: Number(f.hourlyRate),
          securityDeposit: Number(f.securityDeposit),
          maxCapacity: Number(f.maxCapacity),
        }),
      });

      toast.success("Studio updated");
      router.push("/my-listings");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <PageFrame
      title="Edit studio listing"
      subtitle="Keep your space information up to date."
    >
      {!f ? (
        <div className="empty-state">Loading listing…</div>
      ) : (
        <form className="form-card wide-form" onSubmit={submit}>
          <div className="form-grid">
            {[
              "title",
              "hourlyRate",
              "securityDeposit",
              "maxCapacity",
              "location",
              "image",
            ].map((k) => (
              <label key={k}>
                {k}
                <input
                  required
                  value={f[k] ?? ""}
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
              Amenities
              <input
                value={f.amenities}
                onChange={(e) => set("amenities", e.target.value)}
              />
            </label>
          </div>

          <label>
            Description
            <textarea
              rows={5}
              required
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <button className="btn-primary">Save changes</button>
        </form>
      )}
    </PageFrame>
  );
}

export default function EditStudio() {
  return (
    <Suspense
      fallback={<div className="empty-state">Loading editor…</div>}
    >
      <EditStudioContent />
    </Suspense>
  );
}