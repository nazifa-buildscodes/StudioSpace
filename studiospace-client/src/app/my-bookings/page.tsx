
"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import { request, currentUser } from "../../lib/api";
import jsPDF from "jspdf";
type Booking = {
  _id: string;
  studioTitle: string;
  creatorName: string;
  creatorEmail?: string;
  hostEmail?: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  hourlyRate: number;
  totalAmount: number;
  securityDeposit?: number;
  paidAmount: number;
  paymentStatus: string;
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
};

type User = {
  role: "creator" | "host" | "admin";
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
};

type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
};

type BookingContact = {
  host?: ContactInfo;
  creator?: ContactInfo;
  contact?: ContactInfo;
};
export default function MyBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
const [contacts, setContacts] = useState<Record<string, BookingContact>>({});
const [contactLoading, setContactLoading] = useState<string | null>(null);
const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);
  const load = useCallback(async () => {
    try {
      const d = await request("/api/bookings");
      setItems(d.data || []);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Unable to load bookings"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loggedInUser = currentUser();

    if (!loggedInUser) {
      location.href = "/login";
      return;
    }

    setUser(loggedInUser as User);
    load();
  }, [load]);

  async function loadContact(bookingId: string) {
  setContactLoading(bookingId);

  try {
    const result = await request(`/api/bookings/${bookingId}/contact`);

    setContacts((previous) => ({
      ...previous,
      [bookingId]: result.data,
    }));

    toast.success("Contact details loaded");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Unable to load contact"
    );
  } finally {
    setContactLoading(null);
  }
}
async function update(id: string, status: string) {
  const messages: Record<string, string> = {
    confirmed: "Confirm this booking request?",
    rejected: "Reject this booking request?",
    cancelled: "Cancel this booking?",
    completed: "Mark this booking as completed?",
  };

  if (!window.confirm(messages[status] || "Update booking?")) return;

  try {
    await request(`/api/bookings/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });

    toast.success("Booking updated successfully");
    await load();
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Unable to update booking"
    );
  }
}
async function markAsPaid(id: string) {
  if (!window.confirm("Confirm that payment has been received?")) return;

  try {
    await request(`/api/bookings/${id}/payment`, {
      method: "PATCH",
    });

    toast.success("Payment marked as paid!");
    await load();
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Unable to update payment"
    );
  }
}
  if (!user) {
    return (
      <PageFrame title="Bookings" subtitle="Loading your workspace...">
        <div className="empty-state">Loading...</div>
      </PageFrame>
    );
  }

  const isHost = user.role === "host";
  const isCreator = user.role === "creator";
  const isAdmin = user.role === "admin";

function downloadInvoice(b: Booking) {
  const pdf = new jsPDF();
  const contact = contacts[b._id];

  const host =
    contact?.host ||
    (isCreator ? contact?.contact : undefined);

  const creator =
    contact?.creator ||
    (isHost ? contact?.contact : undefined);

  const total = Number(b.totalAmount || 0);
  const paid = Number(b.paidAmount || 0);
  const due = Math.max(0, total - paid);
  const hours =
    Number(b.durationHours) ||
    Math.max(
      0,
      (new Date(`1970-01-01T${b.endTime}`).getTime() -
        new Date(`1970-01-01T${b.startTime}`).getTime()) /
        3600000
    );

  const money = (amount: number) =>
    `BDT ${amount.toLocaleString("en-BD")}`;

  pdf.setFillColor(25, 35, 48);
  pdf.rect(0, 0, 210, 45, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("STUDIOSPACE", 20, 22);

  pdf.setFontSize(11);
  pdf.text("BOOKING INVOICE", 20, 33);

  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(10);
  pdf.text(`Invoice ID: ${b._id}`, 20, 57);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 64);

  pdf.setDrawColor(210, 210, 210);
  pdf.line(20, 72, 190, 72);

  pdf.setFontSize(13);
  pdf.text("BOOKING DETAILS", 20, 84);

  pdf.setFontSize(10);
  pdf.text(`Studio: ${b.studioTitle || "N/A"}`, 20, 95);
  pdf.text(`Booking Date: ${b.date || "N/A"}`, 20, 103);
  pdf.text(`Time: ${b.startTime} - ${b.endTime}`, 20, 111);
  pdf.text(`Duration: ${hours} hours`, 20, 119);
  pdf.text(`Hourly Rate: ${money(Number(b.hourlyRate || 0))}`, 20, 127);
  pdf.text(`Booking Status: ${b.status.toUpperCase()}`, 20, 135);

  pdf.line(20, 143, 190, 143);

  pdf.setFontSize(13);
  pdf.text("PAYMENT SUMMARY", 20, 155);

  pdf.setFontSize(10);
  pdf.text(`Total Amount: ${money(total)}`, 20, 166);
  pdf.text(`Amount Received: ${money(paid)}`, 20, 174);
  pdf.text(`Outstanding: ${money(due)}`, 20, 182);
  pdf.text(
    `Payment Status: ${(b.paymentStatus || "unpaid").toUpperCase()}`,
    20,
    190
  );

  pdf.line(20, 198, 190, 198);

  pdf.setFontSize(13);
  pdf.text("CUSTOMER & HOST DETAILS", 20, 210);

  pdf.setFontSize(10);
  pdf.text(
    `Creator: ${creator?.name || b.creatorName || "N/A"}`,
    20,
    221
  );
  pdf.text(
    `Creator Email: ${creator?.email || b.creatorEmail || "N/A"}`,
    20,
    229
  );
  pdf.text(`Host: ${host?.name || "N/A"}`, 20, 240);
  pdf.text(`Host Email: ${host?.email || "N/A"}`, 20, 248);

  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Thank you for choosing StudioSpace.", 20, 270);

  pdf.save(`StudioSpace-Invoice-${b._id}.pdf`);
}

async function viewInvoice(b: Booking) {
  try {
    setContactLoading(b._id);

    const result = await request(`/api/bookings/${b._id}/contact`);

    setContacts((previous) => ({
      ...previous,
      [b._id]: result.data,
    }));

    setInvoiceBooking(b);
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Unable to load invoice details"
    );
  } finally {
    setContactLoading(null);
  }
}

  const visibleItems =
    filter === "all"
      ? items
      : items.filter((b) => b.status === filter);

  const pendingCount = items.filter((b) => b.status === "pending").length;
  const confirmedCount = items.filter((b) => b.status === "confirmed").length;
  const completedCount = items.filter((b) => b.status === "completed").length;

  const title = isHost
    ? "Booking Requests"
    : isCreator
      ? "My Bookings"
      : "All Bookings";

  const subtitle = isHost
    ? "Manage reservations received for your studio listings."
    : isCreator
      ? "Track your studio reservations and booking status."
      : "Monitor all studio reservations across StudioSpace.";

  return (
    <PageFrame title={title} subtitle={subtitle}>
      <div className="spec-grid">
        <div>
          <small>Total bookings</small>
          <b>{items.length}</b>
        </div>
        <div>
          <small>Pending</small>
          <b>{pendingCount}</b>
        </div>
        <div>
          <small>Confirmed</small>
          <b>{confirmedCount}</b>
        </div>
        <div>
          <small>Completed</small>
          <b>{completedCount}</b>
        </div>
      </div>

      <div className="filter-row" style={{ margin: "24px 0" }}>
        {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map(
          (status) => (
            <button
              key={status}
              className={filter === status ? "btn-primary" : "btn-outline"}
              onClick={() => setFilter(status)}
              style={{ margin: "4px", textTransform: "capitalize" }}
            >
              {status === "all" ? "All bookings" : status}
            </button>
          )
        )}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Studio</th>
              {(!isCreator || isAdmin) && <th>Creator</th>}
              <th>Date & Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {visibleItems.map((b) => (
              <tr key={b._id}>
                <td>
                  <b>{b.studioTitle}</b>
                  {isCreator && (
                    <small>Your reservation</small>
                  )}
                </td>

                {(!isCreator || isAdmin) && (
                  <td>
                    <b>{b.creatorName}</b>
                    <small>{b.creatorEmail}</small>
                  </td>
                )}

                <td>
                  {b.date}
                  <small>
                    {b.startTime} – {b.endTime}
                  </small>
                </td>

                <td>
                  <span className="pill" style={{ textTransform: "capitalize" }}>
                    {b.status}
                  </span>
                </td>

                <td>
                  {b.status === "pending" && (isHost || isAdmin) && (
                    <>
                      <button
                        className="text-button"
                        onClick={() => update(b._id, "confirmed")}
                      >
                        Confirm
                      </button>
                      <button
                        className="text-button danger"
                        onClick={() => update(b._id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  )}
{(b.status === "pending" || b.status === "confirmed") &&
  isCreator && (
    <button
      className="text-button danger"
      onClick={() => update(b._id, "cancelled")}
    >
      Cancel Booking
    </button>
)}

                  {b.status === "confirmed" && (isHost || isAdmin) && (
                    <button
                      className="text-button"
                      onClick={() => update(b._id, "completed")}
                    >
                      Complete
                    </button>
                  )}

                  {b.status === "completed" && (
                    <small className="text-muted">Finished</small>
                  )}
{isHost && b.status === "completed" && (
  <button
    className="text-button"
    disabled={b.paymentStatus === "paid"}
    onClick={() => markAsPaid(b._id)}
  >
    {b.paymentStatus === "paid" ? "Paid ✓" : "Mark as Paid"}
  </button>
)}
                  {(b.status === "cancelled" || b.status === "rejected") && (
                    <small className="text-muted">No action available</small>
                  )}
                  {(b.status === "confirmed" ||
  b.status === "completed" ||
  isAdmin) && (
  <button
    className="text-button"
    disabled={contactLoading === b._id}
    onClick={() => loadContact(b._id)}
  >
    {contactLoading === b._id ? "Loading..." : "View Contact"}
  </button>
)}

{b.status === "completed" && (
  <button
    className="text-button"
    disabled={contactLoading === b._id}
    onClick={() => viewInvoice(b)}
  >
    {contactLoading === b._id ? "Loading Invoice..." : "View Invoice"}
  </button>
)}
{contacts[b._id] && (
  <div style={{ minWidth: "180px", marginTop: "10px" }}>
    {(isAdmin
      ? [
          { label: "Host", person: contacts[b._id].host },
          { label: "Creator", person: contacts[b._id].creator },
        ]
      : [
          {
            label: isHost ? "Creator" : "Host",
            person: contacts[b._id].contact,
          },
        ]
    ).map(({ label, person }) =>
      person ? (
        <div key={label} style={{ marginBottom: "10px" }}>
          <b>{label}: {person.name}</b>
          <small>{person.email}</small>

          {person.phone && (
            <small>
              Phone: <a href={`tel:${person.phone}`}>{person.phone}</a>
            </small>
          )}

          {person.whatsapp && (
            <small>
              <a
                href={`https://wa.me/${person.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </small>
          )}
        </div>
      ) : null
    )}
  </div>
)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && visibleItems.length === 0 && (
          <div className="empty-state">
            {filter !== "all"
              ? `No ${filter} bookings found.`
              : isHost
                ? "No booking requests yet. Your reservations will appear here."
                : isCreator
                  ? "You haven't booked any studio yet. Explore studios to get started."
                  : "No bookings found."}
          </div>
        )}

        {loading && <div className="empty-state">Loading bookings...</div>}
      </div>
      
{invoiceBooking && (
  <div
    onClick={() => setInvoiceBooking(null)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      overflowY: "auto",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#111827",
        color: "#f9fafb",
        borderRadius: 18,
        padding: 26,
        width: "100%",
        maxWidth: 650,
        maxHeight: "90vh",
        overflowY: "auto",
        border: "1px solid var(--border, #ddd)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>StudioSpace</h2>
          <small>BOOKING INVOICE</small>
        </div>
        <button
          className="btn-outline"
          onClick={() => setInvoiceBooking(null)}
        >
          Close ✕
        </button>
      </div>

      <hr />

      <p><b>Invoice ID:</b> {invoiceBooking._id}</p>
      <p><b>Booking Status:</b> Completed</p>

      <h3>Booking Details</h3>
      <p><b>Studio:</b> {invoiceBooking.studioTitle}</p>
      <p><b>Date:</b> {invoiceBooking.date}</p>
      <p>
        <b>Time:</b> {invoiceBooking.startTime} – {invoiceBooking.endTime}
      </p>
      <p><b>Duration:</b> {invoiceBooking.durationHours} hours</p>
      <p>
        <b>Hourly Rate:</b> ৳
        {Number(invoiceBooking.hourlyRate || 0).toLocaleString("en-BD")}
      </p>

      <hr />

      <h3>Payment Summary</h3>
      <p>
        <b>Total Amount:</b> ৳
        {Number(invoiceBooking.totalAmount || 0).toLocaleString("en-BD")}
      </p>
      <p>
        <b>Received:</b> ৳
        {Number(invoiceBooking.paidAmount || 0).toLocaleString("en-BD")}
      </p>
      <p>
        <b>Due:</b> ৳
        {Math.max(
          0,
          Number(invoiceBooking.totalAmount || 0) -
            Number(invoiceBooking.paidAmount || 0)
        ).toLocaleString("en-BD")}
      </p>
      <p>
        <b>Payment Status:</b>{" "}
        {(invoiceBooking.paymentStatus || "unpaid").toUpperCase()}
      </p>

      <hr />

      
<h3>Creator Information</h3>

<p>
  <b>Name:</b>{" "}
  {contacts[invoiceBooking._id]?.creator?.name ||
    (isHost ? contacts[invoiceBooking._id]?.contact?.name : user?.name) ||
    invoiceBooking.creatorName || "N/A"}
</p>
<p>
  <b>Email:</b>{" "}
  {contacts[invoiceBooking._id]?.creator?.email ||
    (isHost ? contacts[invoiceBooking._id]?.contact?.email : user?.email) ||
    invoiceBooking.creatorEmail || "N/A"}
</p>
<p>
  <b>Phone:</b>{" "}
  {contacts[invoiceBooking._id]?.creator?.phone ||
    (isHost ? contacts[invoiceBooking._id]?.contact?.phone : user?.phone) ||
    "N/A"}
</p>
<p>
  <b>WhatsApp:</b>{" "}
  {contacts[invoiceBooking._id]?.creator?.whatsapp ||
    (isHost ? contacts[invoiceBooking._id]?.contact?.whatsapp : user?.whatsapp) ||
    "N/A"}
</p>

<hr />

<h3>Host Information</h3>

<p>
  <b>Name:</b>{" "}
  {contacts[invoiceBooking._id]?.host?.name ||
    (isCreator ? contacts[invoiceBooking._id]?.contact?.name : user?.name) ||
    "N/A"}
</p>
<p>
  <b>Email:</b>{" "}
  {contacts[invoiceBooking._id]?.host?.email ||
    (isCreator ? contacts[invoiceBooking._id]?.contact?.email : user?.email) ||
    "N/A"}
</p>
<p>
  <b>Phone:</b>{" "}
  {contacts[invoiceBooking._id]?.host?.phone ||
    (isCreator ? contacts[invoiceBooking._id]?.contact?.phone : user?.phone) ||
    "N/A"}
</p>
<p>
  <b>WhatsApp:</b>{" "}
  {contacts[invoiceBooking._id]?.host?.whatsapp ||
    (isCreator ? contacts[invoiceBooking._id]?.contact?.whatsapp : user?.whatsapp) ||
    "N/A"}
</p>

      <hr />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={() => downloadInvoice(invoiceBooking)}
        >
          Download PDF Invoice
        </button>
        <button
          className="btn-outline"
          onClick={() => setInvoiceBooking(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
</PageFrame>

  
  );
}
