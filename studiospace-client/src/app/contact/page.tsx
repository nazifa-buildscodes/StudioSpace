
"use client";

import {
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import PageFrame from "@/components/PageFrame";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to send message.");
      }

      setSuccess("Your message has been sent successfully!");
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageFrame
      title="Get in Touch"
      subtitle="Have a question or need help? We'd love to hear from you."
    >
      <section className="contact-section">
        <div className="contact-info">
          <span className="eyebrow">CONTACT STUDIOSPACE</span>
          <h2>Let's start a conversation.</h2>
          <p>
            Whether you're a creator looking for the perfect studio or a
            host ready to share your space, we're here to help.
          </p>

          <div className="contact-info-item">
            <span>✉</span>
            <div>
              <strong>Email Us</strong>
              <p>support@studiospace.com</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span>⌖</span>
            <div>
              <strong>Our Community</strong>
              <p>Connecting creators and studio hosts.</p>
            </div>
          </div>

          <div className="contact-info-item">
            <span>◷</span>
            <div>
              <strong>Support Hours</strong>
              <p>Monday – Friday, 9 AM – 6 PM</p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send us a message</h2>
          <p>Fill out the form below and we'll get back to you.</p>

          {success && (
            <div className="contact-success">{success}</div>
          )}

          {error && (
            <div className="contact-error">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              placeholder="What is this about?"
              value={form.subject}
              onChange={handleChange}
              required
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Your Message</label>
            <textarea
              id="message"
              name="message"
              placeholder="Write your message here..."
              rows={6}
              value={form.message}
              onChange={handleChange}
              required
              maxLength={3000}
            />
          </div>

          <button
            type="submit"
            className="btn-primary contact-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Message →"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .contact-section {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 48px;
          padding: 35px 0 70px;
          align-items: start;
        }

        .contact-info {
          padding: 25px 0;
        }

        .contact-info h2 {
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          margin: 18px 0;
        }

        .contact-info > p,
        .contact-info-item p,
        .contact-form > p {
          color: var(--text-muted, #94a3b8);
          line-height: 1.7;
        }

        .contact-info-item {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 30px;
        }

        .contact-info-item > span {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: rgba(190, 242, 100, 0.12);
          color: #bef264;
          font-size: 23px;
        }

        .contact-info-item p {
          margin: 5px 0 0;
        }

        .contact-form {
          padding: 30px;
          border: 1px solid var(--border, #293241);
          border-radius: 22px;
          background: var(--surface, #111827);
        }

        .contact-form h2 {
          font-size: 25px;
          margin: 0 0 8px;
        }

        .contact-form > p {
          margin-bottom: 25px;
        }

        .form-group {
          margin-bottom: 19px;
        }

        .form-group label {
          display: block;
          margin-bottom: 9px;
          font-weight: 600;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 14px 15px;
          border-radius: 12px;
          border: 1px solid var(--border, #374151);
          background: var(--background, #0b0f17);
          color: var(--foreground, #f8fafc);
          font: inherit;
          outline: none;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #bef264;
        }

        .form-group textarea {
          resize: vertical;
        }

        .contact-submit {
          width: 100%;
          padding: 15px;
          border: none;
          cursor: pointer;
          font-weight: 700;
        }

        .contact-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .contact-success,
        .contact-error {
          padding: 13px;
          border-radius: 10px;
          margin-bottom: 18px;
        }

        .contact-success {
          background: rgba(34, 197, 94, 0.12);
          color: #4ade80;
        }

        .contact-error {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }

        @media (max-width: 768px) {
          .contact-section {
            grid-template-columns: 1fr;
            gap: 25px;
          }

          .contact-form {
            padding: 22px;
          }
        }
      `}</style>
    </PageFrame>
  );
}
