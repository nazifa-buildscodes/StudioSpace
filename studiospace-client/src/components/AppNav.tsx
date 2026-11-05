
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  currentUser,
  logout,
  refreshCurrentUser,
  type User,
} from "../lib/api";

export default function AppNav() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    const syncUser = () => {
      if (active) setUser(currentUser());
    };

    syncUser();

    refreshCurrentUser()
      .then((updatedUser) => {
        if (active) setUser(updatedUser);
      })
      .catch(() => {
        if (active) setUser(currentUser());
      });

    window.addEventListener("studiospace:user-updated", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      active = false;
      window.removeEventListener("studiospace:user-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  // Detect the currently visible homepage section.
  useEffect(() => {
    if (user || pathname !== "/") return;

    const sections = [
      "home",
      "studios",
      "how-it-works",
      "about",
      "contact",
    ];

    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (sections.includes(hash)) {
        setActiveSection(hash);
      } else if (!hash) {
        setActiveSection("home");
      }
    };

    updateFromHash();

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    window.addEventListener("hashchange", updateFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, [user, pathname]);

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.replace("/login");
  };

  const routeActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sectionActive = (section: string) =>
    pathname === "/" && activeSection === section;

  return (
    <header className="app-nav">
      <div className="container-custom nav-inner">
        <Link href="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">S</span>
          Studio<span className="brand-text">Space</span>
        </Link>

       <button
  type="button"
  className="mobile-toggle"
  onClick={() => setOpen((previous) => !previous)}
  aria-label={open ? "Close navigation menu" : "Open navigation menu"}
  aria-expanded={open}
  aria-controls="primary-navigation"
>
  {open ? "✕" : "☰"}
</button>
<nav
  id="primary-navigation"
  className={open ? "nav-links open" : "nav-links"}
>          {!user ? (
            <>
              <Link
                href="/#home"
                className={sectionActive("home") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                Home
              </Link>

              <Link
                href="/#studios"
                className={sectionActive("studios") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                Explore Studios
              </Link>

              <Link
                href="/#how-it-works"
                className={sectionActive("how-it-works") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                How It Works
              </Link>

              <Link
                href="/#about"
                className={sectionActive("about") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                About Us
              </Link>

              <Link
                href="/#contact"
                className={sectionActive("contact") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                Contact
              </Link>

              <Link
                href="/login"
                className={routeActive("/login") ? "nav-active" : ""}
                onClick={closeMenu}
              >
                Login
              </Link>

              <Link
                className="btn-primary nav-cta"
                href="/register"
                onClick={closeMenu}
              >
                Get Started
              </Link>
            </>
          ) : user.role === "admin" ? (
            <>
              <Link href="/admin" className={routeActive("/admin") && pathname === "/admin" ? "nav-active" : ""} onClick={closeMenu}>Dashboard</Link>
              <Link href="/admin/users" className={routeActive("/admin/users") ? "nav-active" : ""} onClick={closeMenu}>Users</Link>
              <Link href="/admin/studios" className={routeActive("/admin/studios") ? "nav-active" : ""} onClick={closeMenu}>Studios</Link>
              <Link href="/admin/bookings" className={routeActive("/admin/bookings") ? "nav-active" : ""} onClick={closeMenu}>Bookings</Link>
              <Link href="/admin/reviews" className={routeActive("/admin/reviews") ? "nav-active" : ""} onClick={closeMenu}>Reviews</Link>
              <Link href="/admin/revenue" className={routeActive("/admin/revenue") ? "nav-active" : ""} onClick={closeMenu}>Revenue</Link>
              <Link href="/admin/contacts" className={routeActive("/admin/contacts") ? "nav-active" : ""} onClick={closeMenu}>Contacts</Link>

              <Link href="/profile" className={`profile-nav ${routeActive("/profile") ? "nav-active" : ""}`} onClick={closeMenu}>
                {user.photoURL ? <img src={user.photoURL} alt="" /> : <span className="avatar-fallback">{user.name?.[0] || "A"}</span>}
                Profile
              </Link>

              <button className="nav-action" onClick={handleLogout}>Logout</button>
            </>
          ) : user.role === "host" ? (
            <>
              <Link href="/studios" className={routeActive("/studios") ? "nav-active" : ""} onClick={closeMenu}>Explore Studios</Link>
              <Link href="/dashboard" className={routeActive("/dashboard") ? "nav-active" : ""} onClick={closeMenu}>Dashboard</Link>
              <Link href="/add-studio" className={routeActive("/add-studio") ? "nav-active" : ""} onClick={closeMenu}>Add Studio</Link>
              <Link href="/my-listings" className={routeActive("/my-listings") ? "nav-active" : ""} onClick={closeMenu}>My Listings</Link>
              <Link
  href="/revenue"
  className={routeActive("/revenue") ? "nav-active" : ""}
  onClick={closeMenu}
>
  Revenue
</Link>
              <Link href="/profile" className={`profile-nav ${routeActive("/profile") ? "nav-active" : ""}`} onClick={closeMenu}>
                {user.photoURL ? <img src={user.photoURL} alt="" /> : <span className="avatar-fallback">{user.name?.[0] || "H"}</span>}
                Profile
              </Link>

              <button className="nav-action" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/studios" className={routeActive("/studios") ? "nav-active" : ""} onClick={closeMenu}>Explore Studios</Link>
              <Link href="/dashboard" className={routeActive("/dashboard") ? "nav-active" : ""} onClick={closeMenu}>Dashboard</Link>
              <Link href="/my-bookings" className={routeActive("/my-bookings") ? "nav-active" : ""} onClick={closeMenu}>My Bookings</Link>
              <Link
  href="/wishlist"
  className={routeActive("/wishlist") ? "nav-active" : ""}
  onClick={closeMenu}
>
  Wishlist
</Link>
              <Link href="/profile" className={`profile-nav ${routeActive("/profile") ? "nav-active" : ""}`} onClick={closeMenu}>
                {user.photoURL ? <img src={user.photoURL} alt="" /> : <span className="avatar-fallback">{user.name?.[0] || "C"}</span>}
                Profile
              </Link>

              <button className="nav-action" onClick={handleLogout}>Logout</button>
            </>
          )}

         <select
  aria-label="Choose appearance"
  className="theme-select"
  value={theme || "system"}
  onChange={(e) => {
    setTheme(e.target.value);
    closeMenu();
  }}
>
  <option value="system">System Theme</option>
  <option value="dark">Dark Mode</option>
  <option value="light">Light Mode</option>
</select>
        </nav>
      </div>
    </header>
  );
}
