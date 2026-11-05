
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import { toast } from "sonner";

type Studio = {
  _id: string;
  title: string;
  category: string;
  hourlyRate: number;
  location: string;
  image: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const slides = [
  {
    eyebrow: "CREATE WITHOUT LIMITS",
    title: "Find Your Space. Create Your Story.",
    description:
      "Discover inspiring creative spaces designed for photographers, filmmakers, musicians and creators.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2000&q=85",
  },
  {
    eyebrow: "BUILT FOR CREATORS",
    title: "Your Next Big Idea Starts Here.",
    description:
      "From professional photography studios to podcast rooms, find the perfect space for your next project.",
    image:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=2000&q=85",
  },
  {
    eyebrow: "HOST YOUR CREATIVE SPACE",
    title: "Turn Your Studio Into Opportunity.",
    description:
      "List your creative space, connect with talented creators and grow your studio business.",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2000&q=85",
  },
];

const categories = [
  {
    name: "Photo Studios",
    slug: "Photography",
    icon: "📸",
    description: "Professional spaces for stunning photography.",
    image:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Sound Stages",
    slug: "Film Studio",
    icon: "🎬",
    description: "Production-ready spaces for film and video.",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Podcast Rooms",
    slug: "Podcast Studio",
    icon: "🎙️",
    description: "Record your next great conversation.",
    image:
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Music Suites",
    slug: "Music Studio",
    icon: "🎵",
    description: "Make music in inspiring recording spaces.",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=700&q=80",
  },
  {
    name: "Art Workshops",
    slug: "Art Studio",
    icon: "🎨",
    description: "Creative environments for artists and makers.",
    image:
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=700&q=80",
  },
];

const workflow = [
  {
    number: "01",
    title: "Discover Spaces",
    description:
      "Explore creative studios and find a space that matches your vision.",
    icon: "⌕",
  },
  {
    number: "02",
    title: "Select Shoot Hours",
    description:
      "Choose your preferred date, time and booking duration.",
    icon: "◷",
  },
  {
    number: "03",
    title: "Book Instantly",
    description:
      "Reserve your favorite studio and get ready for your project.",
    icon: "✓",
  },
  {
    number: "04",
    title: "Create & Produce",
    description:
      "Show up, get creative and bring your ideas to life.",
    icon: "✦",
  },
];

const guarantees = [
  {
    icon: "◈",
    title: "Liability Protection",
    description:
      "Enjoy added peace of mind while creating in professional studio spaces.",
  },
  {
    icon: "✓",
    title: "Verified Profiles",
    description:
      "Discover hosts and creative spaces with transparent information.",
  },
  {
    icon: "⌘",
    title: "Equipment Safety",
    description:
      "Find spaces with clearly listed facilities and equipment information.",
  },
  {
    icon: "♡",
    title: "Creator Support",
    description:
      "Get help when you need assistance with your studio experience.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="section-label mb-4">{eyebrow}</p>
      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="text-muted mx-auto mt-5 max-w-xl leading-7">
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
 // Fetch Studios
useEffect(() => {
  setMounted(true);

  const fetchStudios = async () => {
    try {
      const response = await fetch(`${API_URL}/api/studios`);

      if (!response.ok) {
        throw new Error("Could not fetch studios");
      }

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const sorted = [...result.data].sort(
          (a: Studio, b: Studio) =>
            (b.rating || 0) - (a.rating || 0)
        );

        setStudios(sorted.slice(0, 6));
      }
    } catch (error) {
      console.error("Studio loading error:", error);
      toast.error("Unable to load studios. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  fetchStudios();
}, []);

// Track Active Navbar Section


// Track Active Navbar Section
useEffect(() => {
  const sectionIds = [
    "featured-studios",
    "how-it-works",
    "about",
    "contact",
  ];

  let ticking = false;

  const handleScroll = () => {
    if (ticking) return;

    ticking = true;

    window.requestAnimationFrame(() => {
const activationLine = window.innerHeight * 0.5;
      let currentSection = "home";

      for (const id of sectionIds) {
        const section = document.getElementById(id);

        if (!section) continue;

        const top = section.getBoundingClientRect().top;

        if (top <= activationLine) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
      ticking = false;
    });
  };

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  window.addEventListener("resize", handleScroll);

  handleScroll();

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  };
}, []);



 const navigation = [
{ label: "Home", href: "#home" },
  { label: "Explore Studios", href: "#featured-studios" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About Us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

  return (
    <>
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
<Link
  href="/"
  onClick={() => {
    setMobileMenuOpen(false);
    setActiveSection("home");
  }}
            className="flex items-center gap-2.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-bold text-white">
              S
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Studio<span className="text-[var(--primary)]">Space</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium lg:flex">
  {navigation.map((item) => {
    const isActive =
  (item.href === "/" &&
    activeSection === "home") ||
  (item.href.startsWith("#") &&
    activeSection === item.href.substring(1));

    return (
      <Link
  key={item.label}
  href={item.href}
 onClick={() => {
  setMobileMenuOpen(false);
}}
        className={`relative py-2 transition hover:text-[var(--primary)] ${
          isActive
            ? "font-bold text-[var(--primary)]"
            : "text-muted"
        }`}
      >
        {item.label}

        {isActive && (
          <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[var(--primary)]" />
        )}
      </Link>
    );
  })}
</nav>

          <div className="hidden items-center gap-3 lg:flex">
            {mounted && (
              <select
                aria-label="Select theme"
                value={theme ?? "dark"}
                onChange={(e) => setTheme(e.target.value)}
                className="w-[112px] rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs font-semibold text-[var(--foreground)] outline-none"
              >
                <option value="dark">🌙 Dark</option>
                <option value="light">☀️ Light</option>
                <option value="system">💻 System</option>
              </select>
            )}

            <Link
              href="/login"
              className="rounded-full px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface)]"
            >
              Log in
            </Link>

            <Link
              href="/register"
              className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
            >
              Get Started ↗
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] text-xl lg:hidden"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-5 shadow-xl lg:hidden">
            <nav className="flex flex-col gap-2">
  {navigation.map((item) => {
    const isActive =
      (item.href === "/" &&
        pathname === "/" &&
        activeSection === "home") ||
      (item.href.startsWith("#") &&
        activeSection === item.href.substring(1));

    return (
   <Link
  key={item.label}
  href={item.href}
onClick={() => {
  setMobileMenuOpen(false);
}}
  className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? "bg-[var(--surface)] text-[var(--primary)]"
      : "text-muted"
  }`}
>
  {item.label}
</Link>
    );
  })}
</nav>
            {mounted && (
              <div className="mt-4">
                <label className="text-muted mb-2 block text-xs font-semibold">
                  Appearance
                </label>
                <select
                  aria-label="Select theme"
                  value={theme ?? "dark"}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                >
                  <option value="dark">🌙 Dark Mode</option>
                  <option value="light">☀️ Light Mode</option>
                  <option value="system">💻 System Default</option>
                </select>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full bg-[var(--primary)] px-4 py-3 text-center text-sm font-bold text-white"
              >
                Get Started ↗
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* HERO SLIDER */}
<section id="home" className="relative scroll-mt-24">
            {mounted ? (
            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              effect="fade"
              loop
              autoplay={{
                delay: 5500,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              className="studio-hero-swiper"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={slide.title}>
                  <div
                    className="relative flex min-h-[590px] items-center overflow-hidden bg-cover bg-center sm:min-h-[660px]"
                    style={{
                      backgroundImage: `url("${slide.image}")`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/15" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

                    <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-24 sm:px-10 lg:px-16">
                      <div className="max-w-3xl">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.18em] text-white backdrop-blur-md">
                          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                          {slide.eyebrow}
                        </div>

                        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-7xl">
                          {slide.title}
                        </h1>

                        <p className="mt-7 max-w-xl text-base leading-8 text-white/75 sm:text-lg">
                          {slide.description}
                        </p>

                        <div className="mt-10 flex flex-wrap gap-4">
                          <Link
                            href="/studios"
                            className="rounded-full bg-[var(--primary)] px-7 py-4 text-sm font-bold text-white shadow-xl transition hover:-translate-y-1 hover:opacity-90"
                          >
                            Explore Studios <span className="ml-2">↗</span>
                          </Link>

                          <Link
                            href="/register"
className={`rounded-full border px-7 py-4 text-sm font-bold backdrop-blur-md transition hover:-translate-y-1 ${
  theme === "light"
    ? "border-white bg-white text-[#14200c] shadow-lg hover:bg-[#c8fa82] hover:text-[#14200c]"
    : "border-white/40 bg-white/10 text-white hover:bg-white hover:text-black"
}`}
                          >
                            Host Your Space
                          </Link>
                        </div>

                        <div className="mt-12 flex items-center gap-3 text-sm text-white/60">
                          <span className="h-px w-12 bg-[var(--primary)]" />
                          0{index + 1} / 03
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="min-h-[590px] bg-[var(--background)] sm:min-h-[660px]" />
          )}
        </section>

        {/* INTRO STRIP */}
        <section className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="container-custom grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
            {[
              ["Creative Spaces", "For every idea"],
              ["Flexible Booking", "Your schedule"],
              ["Unique Locations", "Discover more"],
              ["Creator Community", "Create together"],
            ].map(([title, subtitle]) => (
              <div key={title}>
                <p className="text-sm font-bold sm:text-base">{title}</p>
                <p className="text-muted mt-1 text-xs">{subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURED STUDIOS */}
<section
  id="featured-studios"
  className="section-padding scroll-mt-24"
>          <div className="container-custom">
            <SectionHeading
              eyebrow="DISCOVER YOUR SPACE"
              title="Featured Creative Studios"
              description="Explore inspiring spaces selected to help bring your next creative project to life."
            />

            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="surface animate-pulse overflow-hidden rounded-2xl"
                  >
                    <div className="h-56 bg-[var(--surface-soft)]" />
                    <div className="space-y-3 p-5">
                      <div className="h-4 w-2/3 rounded bg-[var(--surface-soft)]" />
                      <div className="h-4 w-1/2 rounded bg-[var(--surface-soft)]" />
                      <div className="h-8 w-full rounded bg-[var(--surface-soft)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : studios.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {studios.map((studio) => (
                  <article
                    key={studio._id}
                    className="surface card-hover overflow-hidden rounded-2xl"
                  >
                    <div className="relative h-56 overflow-hidden bg-[var(--surface-soft)]">
                      <img
                        src={studio.image || studio.imageUrl || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800"}
                        alt={studio.title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                        {studio.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold">{studio.title}</h3>
                        <span className="shrink-0 text-sm font-bold text-[var(--primary)]">
                          ★ {studio.rating ?? "New"}
                        </span>
                      </div>

                      <p className="text-muted mt-2 text-sm">
                        📍 {studio.location}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                        <p className="text-sm">
                          <strong className="text-lg">
                            ৳{studio.hourlyRate}
                          </strong>
                          <span className="text-muted"> / hour</span>
                        </p>

                        <Link
                          href={`/studios/${studio._id}`}
                          className="text-sm font-bold text-[var(--primary)] hover:underline"
                        >
                          View Details ↗
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="surface rounded-3xl px-6 py-16 text-center">
                <div className="mb-5 text-5xl">🏢</div>
                <h3 className="text-xl font-bold">No Studios Yet</h3>
                <p className="text-muted mx-auto mt-3 max-w-md text-sm leading-7">
                  There are no studios listed yet. Be the first to share your
                  creative space with the community.
                </p>
                <Link
                  href="/add-studio"
                  className="brand-gradient mt-7 inline-flex rounded-full px-6 py-3 text-sm font-bold text-black"
                >
                  Add Your Studio ↗
                </Link>
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                href="/studios"
                className="btn-outline inline-flex rounded-full px-7 py-3.5 text-sm font-bold"
              >
                Explore All Studios ↗
              </Link>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="section-padding bg-[var(--surface)]">
          <div className="container-custom">
            <SectionHeading
              eyebrow="EXPLORE BY CATEGORY"
              title="Find Your Creative Environment"
              description="Whatever you're creating, discover a space that fits your style, tools and vision."
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/studios?category=${encodeURIComponent(category.slug)}`}
                  className="group relative min-h-[300px] overflow-hidden rounded-2xl"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <span className="mb-3 block text-3xl">
                      {category.icon}
                    </span>
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-white/75">
                      {category.description}
                    </p>
                    <span className="mt-4 inline-block text-sm font-bold text-[#c8fa82]">
                      Explore Category ↗
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="section-padding scroll-mt-24">
          <div className="container-custom">
            <SectionHeading
              eyebrow="SIMPLE & SEAMLESS"
              title="How StudioSpace Works"
              description="From finding the perfect location to creating something extraordinary, your journey starts here."
            />

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item) => (
                <div key={item.number} className="relative text-center">
                  <div className="surface mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl text-[var(--primary)]">
                    {item.icon}
                  </div>
                  <p className="mb-2 text-xs font-extrabold tracking-widest text-[var(--primary)]">
                    STEP {item.number}
                  </p>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-muted mx-auto mt-3 max-w-xs text-sm leading-7">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOST GUARANTEE */}
        <section id="about" className="section-padding scroll-mt-24 bg-[var(--surface)]">
          <div className="container-custom">
            <SectionHeading
              eyebrow="CREATE WITH CONFIDENCE"
              title="A Better Experience for Every Creator"
              description="We believe great creative work starts with the right environment and a supportive community."
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {guarantees.map((item) => (
                <div
                  key={item.title}
                  className="surface card-hover rounded-2xl p-7"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-2xl text-[var(--primary)]">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="text-muted mt-3 text-sm leading-7">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOST CTA */}
<section className="section-padding"
>          <div className="container-custom">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#172316] px-7 py-16 text-center text-white sm:px-12 lg:py-24">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#b8f36b]/15 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#b8f36b]/10 blur-3xl" />

              <div className="relative z-10 mx-auto max-w-2xl">
                <p className="mb-4 text-xs font-bold tracking-[0.2em] text-[#c8fa82]">
                  SHARE YOUR SPACE
                </p>
                <h2 className="text-3xl font-extrabold sm:text-5xl">
                  Have a Creative Space?
                  <br />
                  <span className="text-[#c8fa82]">Let It Inspire Others.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  List your studio, connect with creators and make your space
                  part of something bigger.
                </p>
                <Link
                  href="/add-studio"
                  className="mt-9 inline-flex rounded-full bg-[#c8fa82] px-8 py-4 text-sm font-extrabold text-[#14200c] transition hover:-translate-y-1 hover:shadow-xl"
                >
                  Host Your Space ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* CONTACT SECTION */}
<section
  id="contact"
  className="section-padding scroll-mt-24 bg-[var(--surface)]"
>
  <div className="container-custom">
    <div className="surface overflow-hidden rounded-3xl p-8 sm:p-12 lg:flex lg:items-center lg:justify-between">
      <div className="max-w-2xl">
        <p className="section-label mb-4">
          GET IN TOUCH
        </p>

        <h2 className="text-3xl font-extrabold sm:text-4xl">
          Let's Start a Conversation.
        </h2>

        <p className="text-muted mt-4 max-w-xl leading-7">
          Have questions about booking a studio, listing your
          space or using StudioSpace? Our team is here to help.
        </p>
      </div>

      <Link
        href="/contact"
        className="mt-8 inline-flex shrink-0 rounded-full bg-[var(--primary)] px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:opacity-90 lg:mt-0"
      >
        Contact Us ↗
      </Link>
    </div>
  </div>
</section>
      {/* FOOTER */}

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="container-custom grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-xl font-bold text-white">
                S
              </span>
              <span className="text-xl font-extrabold">
                Studio<span className="text-[var(--primary)]">Space</span>
              </span>
            </Link>
            <p className="text-muted mt-5 max-w-xs text-sm leading-7">
              A creative community connecting talented people with inspiring
              studio spaces.
            </p>
            <div className="mt-5 flex gap-3">
              {["Instagram", "Facebook", "X"].map((social) => (
                <span
                  key={social}
                  className="surface rounded-full px-3 py-2 text-xs font-semibold"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Explore</h3>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <Link href="/studios" className="hover:text-[var(--primary)]">
                All Studios
              </Link>
              <Link href="/studios?category=Photography" className="hover:text-[var(--primary)]">
                Photo Studios
              </Link>
              <Link href="/studios?category=Podcast%20Studio" className="hover:text-[var(--primary)]">
                Podcast Rooms
              </Link>
              <Link href="/studios?category=Music%20Studio" className="hover:text-[var(--primary)]">
                Music Suites
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-bold">For Hosts</h3>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <Link href="/add-studio" className="hover:text-[var(--primary)]">
                List Your Studio
              </Link>
              <Link href="/register" className="hover:text-[var(--primary)]">
                Create Account
              </Link>
              <Link href="/login" className="hover:text-[var(--primary)]">
                Host Login
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-5 font-bold">Get in Touch</h3>
            <p className="text-muted text-sm leading-7">
              Have a question or need help? We would love to hear from you.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm font-bold text-[var(--primary)] hover:underline"
            >
              Contact Us ↗
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--border)]">
          <div className="container-custom flex flex-col justify-between gap-3 py-6 text-xs text-muted sm:flex-row">
            <p>© 2026 StudioSpace. All rights reserved.</p>
            <p>Made for creators, with creativity. ✦</p>
          </div>
        </div>
      </footer>
    </>
  );
}
