
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import { request, currentUser } from "../../lib/api";

type RevenueData = {
  totalEarned: number;
  totalReceived: number;
  outstanding: number;
  totalBookings?: number;
  transactions?: {
    bookingId: string;
    studioTitle: string;
    date: string;
    hours: number;
    hourlyRate: number;
    earnedAmount: number;
    paymentStatus: string;
    paidAmount: number;
  }[];
};

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const user = currentUser();

    if (!user) {
      location.href = "/login";
      return;
    }

    if (user.role !== "admin" && user.role !== "host") {
      location.href = "/dashboard";
      return;
    }

    setRole(user.role);

    const endpoint =
      user.role === "admin"
        ? "/api/admin/revenue"
        : "/api/host/earnings";

    request(endpoint)
      .then((result) => setData(result.data))
      .catch((error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load revenue"
        );
      });
  }, []);

  const money = (amount: number) =>
    `৳${Number(amount || 0).toLocaleString("en-BD")}`;

  if (!data) {
    return (
      <PageFrame title="Revenue" subtitle="Loading revenue information...">
        <div className="empty-state">Loading revenue...</div>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      title={role === "admin" ? "Revenue Overview" : "My Earnings"}
      subtitle="Financial summary from completed bookings only."
    >
      <div className="spec-grid">
        <div>
          <small>Total Earned</small>
          <b>{money(data.totalEarned)}</b>
        </div>

        <div>
          <small>Actually Received</small>
          <b>{money(data.totalReceived)}</b>
        </div>

        <div>
          <small>Outstanding</small>
          <b>{money(data.outstanding)}</b>
        </div>

        {role === "admin" && (
          <div>
            <small>Completed Bookings</small>
            <b>{data.totalBookings || 0}</b>
          </div>
        )}
      </div>

      {role === "host" && (
        <div className="table-wrap" style={{ marginTop: 28 }}>
          <h2>Completed Booking Transactions</h2>

          <table>
            <thead>
              <tr>
                <th>Studio</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Earned</th>
                <th>Received</th>
                <th>Payment</th>
              </tr>
            </thead>

            <tbody>
              {(data.transactions || []).map((item) => (
                <tr key={item.bookingId}>
                  <td>{item.studioTitle}</td>
                  <td>{item.date}</td>
                  <td>{item.hours}</td>
                  <td>{money(item.earnedAmount)}</td>
                  <td>{money(item.paidAmount)}</td>
                  <td>
                    <span className="pill">
                      {item.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(data.transactions || []).length === 0 && (
            <div className="empty-state">
              No completed booking transactions yet.
            </div>
          )}
        </div>
      )}
    </PageFrame>
  );
}
