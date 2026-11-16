import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BentoFeatures } from "@/components/BentoFeatures";
import { WorkflowSection } from "@/components/WorkflowSection";
import { DownloadSection } from "@/components/DownloadSection";
import { FaqSection } from "@/components/FaqSection";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0d0e12] text-[#f0f0f4] flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BentoFeatures />
        <WorkflowSection />
        <DownloadSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
