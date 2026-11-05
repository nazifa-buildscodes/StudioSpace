
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import PageFrame from "../../../components/PageFrame";
import { API, request, currentUser } from "../../../lib/api";

function StudioDetailContent() {
  const { id } = useParams<{ id: string }>();

  const [s, setS] = useState<any>(null);
  const [loading, setLoading] = useState(true);
const [date, setDate] = useState("");
const [start, setStart] = useState("10:00");
const [durationHours, setDurationHours] = useState(2);
const [notes, setNotes] = useState("");
const startMinutes = (() => {
  const [hours, minutes] = start.split(":").map(Number);
  return hours * 60 + minutes;
})();

const endMinutes = startMinutes + durationHours * 60;

const calculatedEndTime =
  endMinutes < 24 * 60
    ? `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(
        endMinutes % 60
      ).padStart(2, "0")}`
    : "";

const totalRent = Number(s?.hourlyRate || 0) * durationHours;
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState("5");
  const [reviews, setReviews] = useState<any[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
const [wishlistLoading, setWishlistLoading] = useState(false);
const [contactSubject, setContactSubject] = useState("");
const [contactMessage, setContactMessage] = useState("");
const [contactLoading, setContactLoading] = useState(false);
const user = currentUser();
const isOwnerHost = (studio: any) =>
  user?.role === "host" &&
  user.email?.toLowerCase() === studio?.hostEmail?.toLowerCase();
 useEffect(() => {
  setLoading(true);

  fetch(`${API}/api/studios/${id}`)
    .then((r) => {
      if (!r.ok) throw new Error("Studio not found");
      return r.json();
    })
    .then((d) => setS(d.data))
    .catch(() => setS(null))
    .finally(() => setLoading(false));

  fetch(`${API}/api/studios/${id}/reviews`)
    .then((r) => r.json())
    .then((d) => setReviews(d.data || []))
    .catch(() => setReviews([]));

  if (user?.role === "creator") {
    request("/api/wishlist")
      .then((d) => {
        const saved = (d.data || []).some(
          (item: any) => String(item.studioId) === String(id)
        );
        setIsWishlisted(saved);
      })
      .catch(() => setIsWishlisted(false));
  }
}, [id]); 


async function toggleWishlist() {
  if (!user) {
    toast.error("Please login to save studios");
    return;
  }

  if (user.role !== "creator") {
    toast.error("Only creators can use the wishlist");
    return;
  }

  setWishlistLoading(true);

  try {
    if (isWishlisted) {
      await request(`/api/wishlist/${id}`, { method: "DELETE" });
      setIsWishlisted(false);
      toast.success("Removed from wishlist");
    } else {
      await request(`/api/wishlist/${id}`, { method: "POST" });
      setIsWishlisted(true);
      toast.success("Added to wishlist");
    }
  } catch (e) {
    toast.error(
      e instanceof Error ? e.message : "Wishlist update failed"
    );
  } finally {
    setWishlistLoading(false);
  }
}

async function contactHost() {
  const loggedInUser = currentUser();

  if (!loggedInUser) {
    toast.error("Please login to contact the host");
    return;
  }

  if (loggedInUser.role !== "creator") {
    toast.error("Only creators can contact a host");
    return;
  }

  if (!contactSubject.trim() || !contactMessage.trim()) {
    toast.error("Please enter a subject and message");
    return;
  }

  setContactLoading(true);

  try {
    await request("/api/contact", {
      method: "POST",
      body: JSON.stringify({
        name: loggedInUser.name,
        email: loggedInUser.email,
        phone: loggedInUser.phone || "",
        photoURL: loggedInUser.photoURL || "",
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
        studioId: id,
      }),
    });

    toast.success("Message sent to the host successfully!");
    setContactSubject("");
    setContactMessage("");
  } catch (e) {
    toast.error(
      e instanceof Error ? e.message : "Failed to send message"
    );
  } finally {
    setContactLoading(false);
  }
}

  async function submitReview() {
    try {
      await request(`/api/studios/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(rating),
          comment: reviewText,
        }),
      });

      toast.success("Review submitted");
      setReviewText("");

      const d = await fetch(
        `${API}/api/studios/${id}/reviews`
      ).then((r) => r.json());

      setReviews(d.data || []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Review failed"
      );
    }
  }

  async function book() {
  if (!currentUser()) {
    toast.error("Please login to book a studio");
    return;
  }

  if (
    !date ||
    !start ||
    !calculatedEndTime ||
    durationHours < 0.5 ||
    durationHours > 12 ||
    durationHours * 2 !== Math.floor(durationHours * 2)
  ) {
    toast.error("Please select a valid booking date, time and duration");
    return;
  }

  try {
    await request("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        studioId: id,
        date,
        startTime: start,
        durationHours,
        notes,
      }),
    });

    toast.success("Booking request sent");
  } catch (e) {
    toast.error(
      e instanceof Error ? e.message : "Booking failed"
    );
  }
}
  return (
    <PageFrame
      title={s?.title || "Studio details"}
      subtitle={s?.location}
    >
      {loading ? (
  <div className="studio-skeleton">
    <div className="skeleton-image" />

    <div className="skeleton-content">
      <div className="skeleton-line short" />
      <div className="skeleton-line title" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line medium" />
    </div>
  </div>
) : !s ? (
  <div className="empty-state">
    Studio not found.
  </div>
) : (
<div
  className={`detail-layout ${
    isOwnerHost(s) ? "owner-detail-layout" : ""
  }`}
>
            <div>
  <img
    className="detail-image"
    src={s.image}
    alt={s.title}
  />

            <span className="pill">{s.category}</span>
{isOwnerHost(s) && (
  <a
href={`/studios/edit/${s._id}`}   
 className="btn-primary"
    style={{
      display: "inline-block",
      marginTop: "14px",
      textDecoration: "none",
    }}
  >
    ✎ Edit My Studio
  </a>
)}
            {user?.role === "creator" && (
  <button
    type="button"
    className="btn-outline"
    style={{ marginTop: "14px" }}
    onClick={toggleWishlist}
    disabled={wishlistLoading}
  >
    {wishlistLoading
      ? "Please wait..."
      : isWishlisted
        ? "♥ Remove from Wishlist"
        : "♡ Add to Wishlist"}
  </button>
)}

            <h2>About this space</h2>
            <p className="text-muted">{s.description}</p>

            <div className="spec-grid">
              <div>
                <small>Capacity</small>
                <b>{s.maxCapacity} people</b>
              </div>

              <div>
                <small>Security deposit</small>
                <b>৳{s.securityDeposit || 0}</b>
              </div>

              <div>
                <small>Host</small>
                <b>{s.hostName}</b>
              </div>

              <div>
                <small>Rating</small>
                <b>★ {s.rating || "New"}</b>
              </div>
            </div>
            {user?.role === "creator" && (
              <div className="form-card" style={{ marginTop: "20px" }}>
                <h3>Contact Host</h3>

                <p className="text-muted">
                  Have questions about {s.title}? Send a message to {s.hostName}.
                </p>

                <label>
                  Subject
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Enter message subject"
                    maxLength={150}
                  />
                </label>

                <label>
                  Your Message
                  <textarea
                    rows={5}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Write your message to the host..."
                    maxLength={3000}
                  />
                </label>

                <button
                  type="button"
                  className="btn-primary"
                  onClick={contactHost}
                  disabled={
                    contactLoading ||
                    !contactSubject.trim() ||
                    !contactMessage.trim()
                  }
                >
                  {contactLoading ? "Sending..." : "✉ Send Message"}
                </button>

                <small className="text-muted">
                  You can continue this conversation from your Dashboard Inbox.
                </small>
              </div>
            )}
            <h3>Amenities</h3>
            <div className="tag-row">
              {(s.amenities || []).map((a: string) => (
                <span className="pill" key={a}>
                  {a}
                </span>
              ))}
            </div>

            
            <section className="reviews-section">
  <h3>Creator Reviews</h3>

  {reviews.length > 0 ? (
    <div className="reviews-list">
      {reviews.map((r: any) => (
        <div className="review-card" key={r._id}>
          <strong>{r.creatorName}</strong>
          <p>⭐ {r.rating}/5</p>
          <p>{r.comment || r.review}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-muted">No reviews yet. Be the first to review this studio.</p>
  )}
</section>
{reviews.map((r, index) => (
  <section
    key={r._id || r.id || index}
    className="reviews-section"
  >
  <div className="reviews-heading">
    <div>
      <span className="reviews-eyebrow">COMMUNITY FEEDBACK</span>
      <h2>Reviews from Creators</h2>
      <p className="text-muted">
        Honest experiences shared by creators who booked this studio.
      </p>
    </div>

    <span className="reviews-count">
      ★ {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
    </span>
  </div>

  {reviews.length > 0 ? (
    <div className="reviews-list">
      {reviews.map((r) => (
        <article className="review-card" key={r._id}>
          <div className="review-card-top">
            <div className="review-avatar">
              {(r.creatorName || "C").charAt(0).toUpperCase()}
            </div>

            <div className="review-author">
              <b>{r.creatorName || "Creator"}</b>
              <span>Verified Creator</span>
            </div>

            <div className="review-stars">
              {"★".repeat(Math.min(5, Math.max(0, Number(r.rating) || 0)))}
              <span>{r.rating}/5</span>
            </div>
          </div>

          <p className="review-comment">{r.comment}</p>
        </article>
      ))}
    </div>
  ) : (
    <div className="reviews-empty">
      <span className="reviews-empty-icon">☆</span>
      <h3>No reviews yet</h3>
      <p>
        This studio has not received any reviews yet.
        Be the first to share your experience!
      </p>
    </div>
  )}

  {user?.role === "creator" && (
    <div className="form-card review-form">
      <h3>Share your experience</h3>
      <p className="text-muted">
        Your feedback helps other creators choose the right studio.
      </p>

      <label>
        Your rating
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} Stars
            </option>
          ))}
        </select>
      </label>

      <label>
        Your review
        <textarea
          rows={4}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Tell us about your experience..."
          maxLength={2000}
        />
      </label>

      <button
        type="button"
        className="btn-primary"
        disabled={!reviewText.trim()}
        onClick={submitReview}
      >
        Submit Review
      </button>

      <small className="text-muted">
        Only creators with a completed booking can submit a review.
      </small>
    </div>
  )}
</section>
            ))}
{user?.role === "creator" && (

            <div className="form-card review-form">
              <label>
                Your rating
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Review
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) =>
                    setReviewText(e.target.value)
                  }
                  placeholder="Share your experience after a completed booking"
                />
              </label>

              <button
                className="btn-outline"
                disabled={!reviewText.trim()}
                onClick={submitReview}
              >
                Submit review
              </button>

              <small className="text-muted">
                Only creators with a completed booking can submit one review.
              </small>
                </div>

)}

          </div>

{user?.role === "creator" && (
  <aside className="form-card booking-card">
                <p className="text-muted">Hourly rate</p>

            <h2>
              ৳{s.hourlyRate} <small>/ hour</small>
            </h2>

            <label>
              Booking date
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <div className="two-fields">
  <label>
    Start Time
    <input
      type="time"
      value={start}
      onChange={(e) => setStart(e.target.value)}
    />
  </label>

  <label>
    Duration (Hours)
    <input
      type="number"
      min="0.5"
      max="12"
      step="0.5"
      value={durationHours}
      onChange={(e) =>
        setDurationHours(Number(e.target.value))
      }
    />
  </label>
</div>

<div className="form-card" style={{ marginTop: "16px" }}>
  <h3>Booking Preview</h3>

  <p>Start Time: <b>{start}</b></p>
  <p>Duration: <b>{durationHours} hours</b></p>
  <p>
    End Time: <b>{calculatedEndTime || "Invalid time"}</b>
  </p>
  <p>
    Hourly Rate: <b>৳{s.hourlyRate}</b>
  </p>

  <hr />

  <h3>
    Total Studio Rent: ৳{totalRent.toLocaleString("en-BD")}
  </h3>
</div>

            <label>
              Notes
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </label>

            <button
  className="btn-primary full"
  disabled={
    !date ||
    !calculatedEndTime ||
    durationHours < 0.5 ||
    durationHours > 12 ||
    durationHours * 2 !== Math.floor(durationHours * 2)
  }
  onClick={book}
>
  Request booking
</button>

            <small className="text-muted">
              Your request will be sent to the host.
            </small>
          </aside>
          )}
        </div>
      )}
    </PageFrame>
  );
}

export default function StudioDetail() {
  return (
    <Suspense
      fallback={
        <div className="empty-state">
          Loading studio details…
        </div>
      }
    >
      <StudioDetailContent />
    </Suspense>
  );
}
