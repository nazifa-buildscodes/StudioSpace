"use client";

import { useEffect, useState, type ReactNode } from "react";
import AppNav from "./AppNav";

interface PageFrameProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function PageFrame({ children, title, subtitle }: PageFrameProps) {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  return (
    <>
      <AppNav />
      <main className="container-custom page-main">
        <div className="page-heading">
          <p className="eyebrow">STUDIOSPACE WORKSPACE</p>
          <h1>{title}</h1>
          {subtitle && <p className="text-muted">{subtitle}</p>}
        </div>
        {children}
      </main>
      <footer className="site-footer">
        <div className="container-custom">
          © {year ?? "2026"} StudioSpace · Find your space. Create your story.
        </div>
      </footer>
    </>
  );
}
