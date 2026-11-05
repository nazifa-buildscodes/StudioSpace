
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageFrame from "@/components/PageFrame";
import { request } from "@/lib/api";
import { toast } from "sonner";

type WishlistItem = {
  _id: string;
  studioId: string;
  studioTitle: string;
  studioImage?: string;
  hourlyRate: number;
  location?: string;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState("");

  async function loadWishlist() {
    try {
      const result = await request("/api/wishlist");
      setItems(result.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load wishlist"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWishlist();
  }, []);

  async function removeWishlist(studioId: string) {
    try {
      setRemoving(studioId);

      await request(`/api/wishlist/${studioId}`, {
        method: "DELETE",
      });

      setItems((previous) =>
        previous.filter((item) => item.studioId !== studioId)
      );

      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove"
      );
    } finally {
      setRemoving("");
    }
  }

  return (
    <PageFrame
      title="My Wishlist"
      subtitle="Your saved creative spaces, all in one place."
    >
      {loading ? (
        <p className="py-10 text-center">Loading wishlist...</p>
      ) : items.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <h2 className="text-2xl font-bold">Your wishlist is empty</h2>
          <p className="mt-3 text-gray-400">
            Explore studios and save your favorite spaces.
          </p>
          <Link
            href="/studios"
            className="btn-primary mt-6 inline-block"
          >
            Explore Studios
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="surface-card overflow-hidden"
            >
              {item.studioImage && (
                <img
                  src={item.studioImage}
                  alt={item.studioTitle}
                  className="h-52 w-full object-cover"
                />
              )}

              <div className="p-5">
                <h2 className="text-xl font-bold">
                  {item.studioTitle}
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  {item.location || "Location not available"}
                </p>

                <p className="mt-3 font-semibold">
                  ৳{Number(item.hourlyRate || 0).toLocaleString("en-BD")}
                  <span className="text-sm font-normal text-gray-400">
                    {" "}/ hour
                  </span>
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/studios/${item.studioId}`}
                    className="btn-primary"
                  >
                    View Studio
                  </Link>

                  <button
                    type="button"
                    className="text-button"
                    disabled={removing === item.studioId}
                    onClick={() => removeWishlist(item.studioId)}
                  >
                    {removing === item.studioId
                      ? "Removing..."
                      : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
