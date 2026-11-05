
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import PageFrame from "../../components/PageFrame";
import { request, currentUser } from "../../lib/api";

type Reply = {
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  message: string;
  createdAt: string;
};

type Conversation = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  recipientType?: string;
  hostEmail?: string;
  studioId?: string;
  status?: string;
  createdAt: string;
  replies?: Reply[];
};

export default function MessagesPage() {
  const user = currentUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      const result = await request("/api/messages");
      const data: Conversation[] = result.data || [];

      setConversations(data);

      setSelected((previous) => {
        if (!previous) return data[0] || null;
        return data.find((item) => item._id === previous._id) || data[0] || null;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load messages"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function sendReply() {
    if (!selected || !replyText.trim()) return;

    setSending(true);

    try {
      await request(`/api/messages/${selected._id}/reply`, {
        method: "POST",
        body: JSON.stringify({
          message: replyText.trim(),
        }),
      });

      toast.success("Reply sent successfully");
      setReplyText("");
      await loadMessages();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send reply"
      );
    } finally {
      setSending(false);
    }
  }

  function formatDate(value: string) {
    if (!value) return "";
    return new Date(value).toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <PageFrame
      title="Messages / Inbox"
      subtitle="Communicate with creators, hosts and administrators."
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 0.8fr) minmax(0, 1.7fr)",
          gap: "20px",
          minHeight: "550px",
        }}
      >
        {/* Conversation List */}
        <div className="form-card">
          <h3>Inbox ({conversations.length})</h3>

          {loading ? (
            <p className="text-muted">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              No conversations yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {conversations.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  style={{
                    textAlign: "left",
                    padding: "14px",
                    borderRadius: "10px",
                    border: selected?._id === conversation._id
                      ? "2px solid var(--primary)"
                      : "1px solid var(--border)",
                    background: selected?._id === conversation._id
                      ? "var(--surface)"
                      : "transparent",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <b>
                    {user?.role === "creator"
                      ? conversation.recipientType === "host"
                        ? "Host Conversation"
                        : "Admin Conversation"
                      : conversation.name}
                  </b>

                  <p style={{ margin: "6px 0", fontWeight: 600 }}>
                    {conversation.subject}
                  </p>

                  <small className="text-muted">
                    {conversation.replies?.length || 0} replies
                  </small>

                  <br />

                  <small className="text-muted">
                    {formatDate(conversation.createdAt)}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation Details */}
        <div className="form-card">
          {!selected ? (
            <div className="empty-state">
              Select a conversation to view messages.
            </div>
          ) : (
            <>
              <div
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "14px",
                  marginBottom: "18px",
                }}
              >
                <h3>{selected.subject}</h3>

                <p className="text-muted">
                  Conversation with:{" "}
                  {user?.role === "creator"
                    ? selected.recipientType === "host"
                      ? "Studio Host"
                      : "Administrator"
                    : selected.name}
                </p>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {/* Original Message */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <b>{selected.name} (Creator)</b>

                  <p style={{ margin: "10px 0" }}>
                    {selected.message}
                  </p>

                  <small className="text-muted">
                    {formatDate(selected.createdAt)}
                  </small>
                </div>

                {/* Replies */}
                {(selected.replies || []).map((reply, index) => {
                  const isMine = reply.senderEmail?.toLowerCase() ===
                    user?.email?.toLowerCase();

                  return (
                    <div
                      key={`${selected._id}-${index}`}
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: isMine
                          ? "var(--surface)"
                          : "transparent",
                        border: "1px solid var(--border)",
                        marginLeft: isMine ? "0" : "auto",
                        width: "90%",
                      }}
                    >
                      <b>
                        {reply.senderName} ({reply.senderRole})
                      </b>

                      <p style={{ margin: "10px 0" }}>
                        {reply.message}
                      </p>

                      <small className="text-muted">
                        {formatDate(reply.createdAt)}
                      </small>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <div
                style={{
                  marginTop: "24px",
                  borderTop: "1px solid var(--border)",
                  paddingTop: "18px",
                }}
              >
                <label>
                  Write a reply

                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your message..."
                    maxLength={3000}
                    style={{ width: "100%", marginTop: "8px" }}
                  />
                </label>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: "12px" }}
                  onClick={sendReply}
                  disabled={sending || !replyText.trim()}
                >
                  {sending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
