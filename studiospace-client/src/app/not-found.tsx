
import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <span
        style={{
          fontSize: "clamp(90px, 18vw, 160px)",
          fontWeight: 800,
          lineHeight: 1,
          color: "#a3e635",
        }}
      >
        404
      </span>

      <h1 style={{ fontSize: "32px", marginTop: 20 }}>
        Studio Not Found!
      </h1>

      <p style={{ color: "var(--muted)", margin: "12px 0 28px" }}>
        Looks like this creative space doesn't exist.
        Let's get you back on track.
      </p>

      <Link href="/" className="btn-primary">
        ← Back to Home
      </Link>
    </main>
  );
}
