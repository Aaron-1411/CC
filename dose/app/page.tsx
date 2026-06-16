import { Nav } from "@/components/sections/Nav";
import { Hero } from "@/components/sections/Hero";
import { BuildYourBox } from "@/components/sections/BuildYourBox";
import { Quiz } from "@/components/sections/Quiz";
import { SugarComparison } from "@/components/sections/SugarComparison";
import { Lines } from "@/components/sections/Lines";
import { Honesty } from "@/components/sections/Honesty";
import { Proof } from "@/components/sections/Proof";
import { FinalCta } from "@/components/sections/FinalCta";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div id="top" className="bg-mint-light">
      <Nav />
      <main>
        <Hero />
        <BuildYourBox />
        <Quiz />
        <SugarComparison />
        <Lines />
        <Honesty />
        <Proof />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
