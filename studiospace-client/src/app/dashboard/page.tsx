
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageFrame from "../../components/PageFrame";
import { currentUser, request, logout } from "../../lib/api";

export default function Dashboard() {
  const [u, setU] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    const user = currentUser();
    setU(user);

    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user.role === "creator") {
  Promise.all([
    request("/api/bookings"),
    request("/api/wishlist").catch(() => ({ data: [] })),
  ])
    .then(([b, w]) => {
      const bookingData = b.data || [];
      const wishlistData = w.data || [];

      setStats({
        bookings: bookingData.length,
        pending: bookingData.filter(
          (x: any) => x.status === "pending"
        ).length,
        confirmed: bookingData.filter(
          (x: any) => x.status === "confirmed"
        ).length,
        completed: bookingData.filter(
          (x: any) => x.status === "completed"
        ).length,
        wishlist: wishlistData.length,
      });

      const sortedBookings = [...bookingData].sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );

      setRecentBookings(sortedBookings.slice(0, 4));
    })
    .catch((error) => {
      console.error("Creator dashboard error:", error);
    });
} else {
  // Existing Host data loading — unchanged
  Promise.all([
    request("/api/my/studios").catch(() => ({ data: [] })),
    request("/api/bookings").catch(() => ({ data: [] })),
  ]).then(([s, b]) => {
    setStats({
      studios: s.data.length,
      bookings: b.data.length,
      pending: b.data.filter(
        (x: any) => x.status === "pending"
      ).length,
    });
  });
}
  }, [router]);
  return (
  
    <PageFrame
      title={`Welcome, ${u?.name || "Creator"}`}
      subtitle="Your creative workspace, all in one place."
    >
      {u?.role === "creator" ? (
  <div className="creator-dashboard">

    <div className="creator-welcome">
      <div>
        <span className="creator-eyebrow">CREATOR WORKSPACE</span>
        <h2>Your Creative Journey</h2>
        <p>
          Manage your bookings, discover studios and stay connected.
        </p>
      </div>

      <Link href="/studios" className="btn-primary">
        Explore Studios →
      </Link>
    </div>

    <div className="creator-stats">
      {[
        { label: "Total Bookings", value: stats?.bookings },
        { label: "Pending", value: stats?.pending },
        { label: "Confirmed", value: stats?.confirmed },
        { label: "Completed", value: stats?.completed },
        { label: "Saved Studios", value: stats?.wishlist },
      ].map((item) => (
        <div className="creator-stat-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value ?? "—"}</strong>
        </div>
      ))}
    </div>

    <div className="creator-section-heading">
      <div>
        <h2>Your Workspace</h2>
        <p>Everything you need in one place.</p>
      </div>
    </div>

    <div className="creator-actions">
      {[
        {
          href: "/my-bookings",
          icon: "▦",
          title: "My Bookings",
          desc: "Manage reservations, status and invoices.",
        },
        {
          href: "/messages",
          icon: "✉",
          title: "Inbox & Messages",
          desc: "Communicate with hosts and administrators.",
        },
        {
          href: "/wishlist",
          icon: "♥",
          title: "My Wishlist",
          desc: "Manage your saved creative studios.",
        },
        {
          href: "/studios",
          icon: "⌕",
          title: "Explore Studios",
          desc: "Discover spaces for your next project.",
        },
        {
          href: "/profile",
          icon: "◎",
          title: "My Profile",
          desc: "Manage your personal information.",
        },
      ].map((item) => (
        <Link
          href={item.href}
          className="creator-action-card"
          key={item.title}
        >
          <span className="creator-action-icon">{item.icon}</span>
          <h3>{item.title}</h3>
          <p>{item.desc}</p>
          <span className="creator-action-link">Open →</span>
        </Link>
      ))}

      <Link
        href="/my-bookings"
        className="creator-action-card"
      >
        <span className="creator-action-icon">★</span>
        <h3>Reviews & Feedback</h3>
        <p>
          Access completed bookings and review opportunities.
        </p>
        <span className="creator-action-link">View →</span>
      </Link>
    </div>

    <div className="creator-recent-section">
      <div className="creator-section-heading">
        <div>
          <h2>Recent Bookings</h2>
          <p>Your latest studio reservations.</p>
        </div>

        <Link href="/my-bookings" className="creator-view-all">
          View All →
        </Link>
      </div>

      <div className="creator-booking-list">
        {recentBookings.length === 0 ? (
          <div className="creator-empty">
            <h3>No bookings yet</h3>
            <p>Explore studios and book your first creative space.</p>
            <Link href="/studios" className="btn-primary">
              Explore Studios
            </Link>
          </div>
        ) : (
          
          recentBookings.map((booking) => (
            <div
              className="creator-booking-row"
              key={booking._id}
            >
              <div className="creator-booking-icon">▦</div>

              <div className="creator-booking-info">
                <h3>{booking.studioTitle}</h3>
                <p>
                  {booking.date} · {booking.startTime} – {booking.endTime}
                </p>
                <small>
                  ৳{Number(booking.totalAmount || 0).toLocaleString("en-BD")}
                </small>
              </div>

              <span
                className={`creator-status ${
                  booking.status === "completed"
                    ? "success"
                    : booking.status === "confirmed"
                    ? "info"
                    : booking.status === "pending"
                    ? "warning"
                    : "muted"
                }`}
              >
                {booking.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>

    <button className="btn-outline" onClick={logout}>
      Sign out
    </button>

  </div>
) : (
  <>
    <div className="stat-grid">
        <div className="stat-card">
          <span>My listings</span>
          <b>{stats?.studios ?? "—"}</b>
        </div>

        <div className="stat-card">
          <span>My bookings</span>
          <b>{stats?.bookings ?? "—"}</b>
        </div>

        <div className="stat-card">
          <span>Pending requests</span>
          <b>{stats?.pending ?? "—"}</b>
        </div>
      </div>
      <div className="action-grid">
        <Link className="action-card" href="/studios">
          <span>⌕</span>
          <h3>Explore studios</h3>
          <p>Discover a space for your next project.</p>
        </Link>

        {u?.role === "host" && (
          <Link className="action-card" href="/add-studio">
            <span>＋</span>
            <h3>Add a studio</h3>
            <p>List your creative space for the community.</p>
          </Link>
        )}

        <Link className="action-card" href="/my-bookings">
          <span>▦</span>
          <h3>My bookings</h3>
          <p>Track requests and booking status.</p>
        </Link>
{(u?.role === "creator" || u?.role === "host") && (
  <Link className="action-card" href="/messages">
    <span>✉</span>
    <h3>Messages / Inbox</h3>
    <p>View conversations and reply to messages.</p>
  </Link>
)}
        {u?.role === "creator" && (
          <Link className="action-card" href="/wishlist">
            <span>♥</span>
            <h3>My Wishlist</h3>
            <p>View and manage your saved studios.</p>
          </Link>
        )}

        {u?.role === "host" && (
          <Link className="action-card" href="/my-listings">
            
            <span>▤</span>
            <h3>My listings</h3>
            <p>Manage your studio listings.</p>
          </Link>
        )}

        {u?.role === "host" && (
  <Link className="action-card" href="/revenue">
    <span>৳</span>
    <h3>Revenue & Earnings</h3>
    <p>
      Track your studio earnings, completed bookings
      and revenue details.
    </p>
  </Link>
)}
{u?.role === "host" && (
  <Link className="action-card" href="/host/reviews">
    <span>★</span>
    <h3>My Reviews</h3>
    <p>View ratings and feedback from creators.</p>
  </Link>
)}
      </div>

           <button className="btn-outline" onClick={logout}>
        Sign out
      </button>
  </>
)}
    </PageFrame>
  );
}
