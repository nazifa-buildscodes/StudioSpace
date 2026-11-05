
"use client";

import { useCallback, useEffect, useState } from "react";
import PageFrame from "@/components/PageFrame";
import { request } from "@/lib/api";
import { toast } from "sonner";

type Reply = {
  senderId?: string;
  senderName?: string;
  senderEmail?: string;
  senderRole?: string;
  message: string;
  createdAt?: string;
};

type Contact = {
  _id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  replies?: Reply[];
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await request("/api/admin/contacts");
      setContacts(result.data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contacts"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await request(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      toast.success("Status updated");
      await loadContacts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Update failed"
      );
    }
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error("Please write a reply");
      return;
    }

    setSending(true);

    try {
      await request(`/api/messages/${id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      toast.success("Reply sent successfully");
      setReplyText("");
      await loadContacts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send reply"
      );
    } finally {
      setSending(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "Date unavailable";

    return new Date(value).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <PageFrame
      title="Contact Messages"
      subtitle="Manage conversations and reply to StudioSpace users."
    >
      {loading ? (
        <p>Loading messages...</p>
      ) : error ? (
        <p className="text-red-400">{error}</p>
      ) : contacts.length === 0 ? (
        <div className="surface-card p-8 text-center">
          No contact messages found.
        </div>
      ) : (
        <div className="space-y-6">
          {contacts.map((contact) => {
            const isOpen = selectedId === contact._id;

            return (
              <div
                key={contact._id}
                className="surface-card overflow-hidden"
              >
                {/* Contact Information */}
<div className="grid grid-cols-1 items-center gap-6 p-5 md:grid-cols-[1.3fr_1fr_1.1fr_1.2fr_auto]">
                    <div>
                    <small className="text-gray-400">Name / Email</small>
                    <p className="font-semibold">
                      {contact.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {contact.email}
                    </p>
                  </div>

                  <div>
                    <small className="text-gray-400">Subject</small>
                    <p className="font-medium">
                      {contact.subject || "—"}
                    </p>
                  </div>

                  <div>
                    <small className="text-gray-400">Message</small>
                    <p className="line-clamp-2">
                      {contact.message}
                    </p>
                  </div>

                 <div className="flex min-w-0 items-center gap-3">
  <small className="shrink-0 text-muted">Status</small>

  <select
    value={contact.status || "new"}
    onChange={(e) =>
      updateStatus(contact._id, e.target.value)
    }
    className="input-field min-w-0 flex-1 font-semibold"
  >
    <option value="new">New</option>
    <option value="in-progress">In Progress</option>
    <option value="resolved">Resolved</option>
  </select>
</div>

                  <div className="flex items-center">
                    <button
                      type="button"
className="btn-primary min-w-[155px] whitespace-nowrap"
                      onClick={() => {
                        setSelectedId(isOpen ? null : contact._id);
                        setReplyText("");
                      }}
                    >
                      {isOpen ? "Close Conversation" : "View / Reply"}
                      {" "}({contact.replies?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Conversation Thread */}
                {isOpen && (
                  <div className="border-t border-white/10 p-5">
                    <h3 className="mb-4 text-lg font-semibold">
                      Conversation: {contact.subject || "No subject"}
                    </h3>

                    {/* Original Message */}
                    <div className="mb-4 rounded-xl border border-white/10 p-4">
                      <b>
                        {contact.name || "Unknown"} (Creator)
                      </b>

                      <p className="my-3 whitespace-pre-wrap">
                        {contact.message}
                      </p>

                      <small className="text-gray-400">
                        {formatDate(contact.createdAt)}
                      </small>
                    </div>

                    {/* Replies */}
                    {(contact.replies || []).map((reply, index) => (
                      <div
                        key={`${contact._id}-${index}`}
                        className="mb-4 rounded-xl border border-white/10 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <b>
                            {reply.senderName || "Unknown"} (
                            {reply.senderRole || "User"})
                          </b>

                          <small className="text-gray-400">
                            {formatDate(reply.createdAt)}
                          </small>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))}

                    {/* Admin Reply */}
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <label className="mb-2 block font-semibold">
                        Reply to {contact.name || "User"}
                      </label>

                      <textarea
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        maxLength={3000}
                        className="w-full rounded-xl border border-white/10 bg-slate-800 p-4 text-white"
                      />

                      <button
                        type="button"
                        className="btn-primary mt-3"
                        disabled={sending || !replyText.trim()}
                        onClick={() => sendReply(contact._id)}
                      >
                        {sending ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageFrame>
  );
}
