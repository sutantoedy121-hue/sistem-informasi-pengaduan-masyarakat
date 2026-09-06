import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import PublicStatsSection from "@/components/sections/PublicStatsSection";
import TrackTicket from "@/components/sections/TrackTicket";
import Categories from "@/components/sections/Categories";
import ProcessFlow from "@/components/sections/ProcessFlow";
import PublicRecentSection from "@/components/sections/PublicRecentSection";
import CTA from "@/components/sections/CTA";

export default async function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        {/* Ringkasan kinerja: live dari DB via realtime */}
        <PublicStatsSection />
        <TrackTicket />
        <Categories />
        <ProcessFlow />
        {/* Aduan terbaru (tanpa tiket, live) — ditempatkan lebih bawah */}
        <PublicRecentSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
