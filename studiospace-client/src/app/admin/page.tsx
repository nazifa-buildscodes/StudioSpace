
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageFrame from "../../components/PageFrame";
import { currentUser, request } from "../../lib/api";

type AdminStats = {
  userCount?: number;
  studioCount?: number;
  pendingStudios?: number;
  bookingCount?: number;
  pendingBookings?: number;
  reviewCount?: number;
};

const managementItems = [
  {
    title: "Manage Users",
    href: "/admin/users",
    icon: "👥",
    description: "View all registered users, manage accounts, review user details and control account roles.",
  },
  {
    title: "Manage Studios",
    href: "/admin/studios",
    icon: "🏢",
    description: "View studio listings, review submitted studios, approve or reject listings and manage published studios.",
  },
  {
    title: "Add Studio",
    href: "/add-studio",
    icon: "＋",
    description: "Open the studio creation page to submit a new creative space listing.",
  },
  {
    title: "Manage Bookings",
    href: "/admin/bookings",
    icon: "📅",
    description: "Monitor all reservations, check booking details, track booking status and oversee marketplace bookings.",
  },
  {
    title: "Manage Reviews",
    href: "/admin/reviews",
    icon: "⭐",
    description: "Review creator feedback, monitor ratings and moderate platform reviews.",
  },
  {
    title: "Revenue & Payments",
    href: "/admin/revenue",
    icon: "💰",
    description: "Monitor marketplace revenue, booking transactions and available financial reports.",
  },
  {
    title: "Contacts & Inbox",
    href: "/admin/contacts",
    icon: "✉",
    description: "View messages submitted by users, communicate with creators and manage contact requests.",
  },
];

export default function Admin() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (currentUser()?.role !== "admin") {
      router.replace("/login");
      return;
    }

    request("/api/admin/overview")
      .then((response) => {
        setData(response.data);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const statistics = [
    ["Total Users", data?.userCount],
    ["Studio Listings", data?.studioCount],
    ["Awaiting Approval", data?.pendingStudios],
    ["Total Bookings", data?.bookingCount],
    ["Pending Bookings", data?.pendingBookings],
    ["Total Reviews", data?.reviewCount],
  ];

  return (
    <PageFrame
      title="Admin Command Center"
      subtitle="Manage every important part of your StudioSpace marketplace from one place."
    >
      <section>
        <h2>Platform Overview</h2>
        <p>Monitor the current activity and performance of StudioSpace.</p>

        <div className="stat-grid">
          {statistics.map(([label, value]) => (
            <div className="stat-card" key={String(label)}>
              <span>{label}</span>
              <b>
                {loading ? "..." : value ?? "—"}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: "36px" }}>
        <h2>Marketplace Management</h2>
        <p>
          Access all administrative tools and manage the platform efficiently.
        </p>

        <div className="action-grid">
          {managementItems.map((item) => (
            <Link
              className="action-card"
              href={item.href}
              key={item.href}
            >
              <span>{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
