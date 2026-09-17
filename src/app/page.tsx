import { Navbar } from "@/components/site/navbar";
import { HeroSection } from "@/components/site/hero-section";
import { AgentsSection } from "@/components/site/agents-section";
import { CrmDashboardSection } from "@/components/site/crm-dashboard-section";
import { MarqueeTape } from "@/components/site/marquee-tape";
import { FeaturesSection } from "@/components/site/features-section";
import { ProcessSection } from "@/components/site/process-section";
import { UseCasesSection } from "@/components/site/use-cases-section";
import { GrowthTimelineSection } from "@/components/site/growth-timeline-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { CtaFaqSection } from "@/components/site/cta-faq-section";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col">
      <Navbar />
      <HeroSection />
      <AgentsSection />
      <CrmDashboardSection />
      <MarqueeTape />
      <FeaturesSection />
      <ProcessSection />
      <UseCasesSection />
      <GrowthTimelineSection />
      <TestimonialsSection />
      <CtaFaqSection />
      <Footer />
    </main>
  );
}
