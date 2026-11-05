
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageFrame from "../../components/PageFrame";
import { currentUser, request, logout } from "../../lib/api";

export default function Dashboard() {
  const [u, setU] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
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
    Promise.all([
      request("/api/my/studios").catch(() => ({ data: [] })),
      request("/api/bookings").catch(() => ({ data: [] })),
    ]).then(([s, b]) => {
      setStats({
        studios: s.data.length,
        bookings: b.data.length,
        pending: b.data.filter((x: any) => x.status === "pending").length,
      });
    });
  }, [router]);
  return (
    <PageFrame
      title={`Welcome, ${u?.name || "Creator"}`}
      subtitle="Your creative workspace, all in one place."
    >
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
    </PageFrame>
  );
}
