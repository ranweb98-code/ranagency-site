import { Navbar } from "@/components/site/navbar";
import { AutomationSection } from "@/components/site/automation-section";
import { MarqueeTape } from "@/components/site/marquee-tape";
import { FeaturesSection } from "@/components/site/features-section";
import { ProcessSection } from "@/components/site/process-section";
import { UseCasesSection } from "@/components/site/use-cases-section";
import { GrowthTimelineSection } from "@/components/site/growth-timeline-section";
import { TestimonialsSection } from "@/components/site/testimonials-section";
import { CtaFaqSection } from "@/components/site/cta-faq-section";
import { Footer } from "@/components/site/footer";
import { WhatsappFloatButton } from "@/components/site/whatsapp-float-button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />
      <AutomationSection />
      <MarqueeTape />
      <FeaturesSection />
      <ProcessSection />
      <UseCasesSection />
      <GrowthTimelineSection />
      <TestimonialsSection />
      <CtaFaqSection />
      <Footer />
      <WhatsappFloatButton />
    </main>
  );
}
