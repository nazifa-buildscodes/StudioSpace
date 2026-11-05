
"use client";

import { useEffect, useState } from "react";
import PageFrame from "@/components/PageFrame";
import { request, currentUser } from "@/lib/api";
import { toast } from "sonner";

type Review = {
  _id: string;
  studioTitle?: string;
  creatorName?: string;
  creatorEmail?: string;
  rating?: number;
  comment?: string;
  createdAt?: string;
};

export default function HostReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser()?.role !== "host") {
      window.location.href = "/login";
      return;
    }

    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const result = await request("/api/host/reviews");
      setReviews(result.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load reviews"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageFrame
      title="My Studio Reviews"
      subtitle="See ratings and feedback from creators who booked your studios."
    >
      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="surface-card p-8 text-center">
          No reviews received yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {reviews.map((review) => (
            <div key={review._id} className="surface-card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">
                  {review.studioTitle || "My Studio"}
                </h3>

                <span className="font-bold text-amber-500">
                  ★ {review.rating || 0}/5
                </span>
              </div>

              <p className="mt-4 whitespace-pre-wrap">
                {review.comment || "No written feedback."}
              </p>

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <p className="font-medium">
                  {review.creatorName || "Creator"}
                </p>

                <p className="text-sm text-[var(--muted)]">
                  {review.creatorEmail || ""}
                </p>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  {review.createdAt
                    ? new Date(review.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
