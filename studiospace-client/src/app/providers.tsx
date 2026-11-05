
"use client";

import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useState, type ReactNode } from "react";

function ThemeAwareToaster() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={resolvedTheme === "light" ? "light" : "dark"}
      duration={3500}
    />
  );
}

export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemeAwareToaster />
      </ThemeProvider>
  );
}
