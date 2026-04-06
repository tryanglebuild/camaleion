import Nav from "@/components/Nav";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import FeaturesSection from "@/components/FeaturesSection";
import PreviewSection from "@/components/PreviewSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import InstallSection from "@/components/InstallSection";
import DemoSection from "@/components/DemoSection";
import LightModeSection from "@/components/LightModeSection";
import CtaSection from "@/components/CtaSection";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <PreviewSection />
        <HowItWorksSection />
        <InstallSection />
        <DemoSection />
        <LightModeSection />
        <CtaSection />
      </main>
    </>
  );
}
