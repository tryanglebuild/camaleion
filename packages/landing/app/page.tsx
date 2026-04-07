import Nav from "@/components/Nav";
import HeroSection from "@/components/HeroSection";
import DrawCanvas from "@/components/DrawCanvas";
import HowItWorksSection from "@/components/HowItWorksSection";
import CtaSection from "@/components/CtaSection";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <DrawCanvas />
        <HowItWorksSection />
        <CtaSection />
      </main>
    </>
  );
}
