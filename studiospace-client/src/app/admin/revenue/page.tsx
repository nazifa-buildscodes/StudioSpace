
"use client";

import { useEffect, useState } from "react";
import PageFrame from "@/components/PageFrame";
import { request } from "@/lib/api";

type RevenueData = {
  totalBookings: number;
  paidBookings: number;
  totalEarned: number;
  totalReceived: number;
  outstanding: number;
};

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const result = await request("/api/admin/revenue");
        setData(result.data || result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load revenue"
        );
      } finally {
        setLoading(false);
      }
    };

    void loadRevenue();
  }, []);

  const money = (amount = 0) =>
    new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  return (
    <PageFrame
      title="Revenue Overview"
      subtitle="Monitor completed bookings, payments and outstanding amounts."
    >
      {loading ? (
        <p>Loading revenue...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card p-6">
              <p className="text-gray-400">Completed Bookings</p>
              <h2 className="mt-3 text-3xl font-bold">
                {data?.totalBookings ?? 0}
              </h2>
            </div>

            <div className="surface-card p-6">
              <p className="text-gray-400">Paid Bookings</p>
              <h2 className="mt-3 text-3xl font-bold">
                {data?.paidBookings ?? 0}
              </h2>
            </div>

            <div className="surface-card p-6">
              <p className="text-gray-400">Total Earned</p>
              <h2 className="mt-3 text-3xl font-bold">
                {money(data?.totalEarned)}
              </h2>
            </div>

            <div className="surface-card p-6">
              <p className="text-gray-400">Actually Received</p>
              <h2 className="mt-3 text-3xl font-bold">
                {money(data?.totalReceived)}
              </h2>
            </div>

            <div className="surface-card p-6 md:col-span-2">
              <p className="text-gray-400">Outstanding / Unpaid Amount</p>
              <h2 className="mt-3 text-3xl font-bold">
                {money(data?.outstanding)}
              </h2>
            </div>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            Revenue is calculated from completed bookings only.
            Received amounts reflect payments recorded by the admin or host.
          </p>
        </>
      )}
    </PageFrame>
  );
}
