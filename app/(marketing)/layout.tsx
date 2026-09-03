import { LandingFloatingNav } from "@/components/landing/LandingFloatingNav";

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4";
const VIDEO_POSTER =
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main
      className="min-h-screen w-full bg-[#d9d9d9]"
      style={{ fontFamily: "var(--font-landing-sans), Inter, sans-serif" }}
    >
      <section className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#d9d9d9]">
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disableRemotePlayback
          poster={VIDEO_POSTER}
          aria-hidden="true"
          tabIndex={-1}
          {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-white/15" />

        <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          <LandingFloatingNav />
          {children}
        </div>
      </section>
    </main>
  );
}
