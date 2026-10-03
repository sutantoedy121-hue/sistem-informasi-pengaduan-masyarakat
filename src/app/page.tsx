import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import PublicStatsSection from "@/components/sections/PublicStatsSection";
import TrackTicket from "@/components/sections/TrackTicket";
import Categories from "@/components/sections/Categories";
import ProcessFlow from "@/components/sections/ProcessFlow";
import PublicRecentSection from "@/components/sections/PublicRecentSection";
import ShowcaseGallery from "@/components/sections/ShowcaseGallery";
import CTA from "@/components/sections/CTA";

export default async function HomePage() {
  return (
    <>
      <Navbar />
      <main className="overflow-hidden">
        <Hero />
        
        {/* Ringkasan kinerja */}
        <PublicStatsSection />

        <TrackTicket />

        <Categories />

        {/* 3D Curved Showcase Carousel */}
        <ShowcaseGallery />

        {/* Alur Pengaduan */}
        <ProcessFlow />

        {/* Aduan terbaru (tanpa tiket, live) */}
        <PublicRecentSection />

        <CTA />
      </main>
      <Footer />
    </>
  );
}
