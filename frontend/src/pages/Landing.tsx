import { NavBar } from '../components/NavBar';
import { Hero } from '../components/Hero';
import { TrustedBy } from '../components/TrustedBy';
import { Features } from '../components/Features';
import { Showcase } from '../components/Showcase';
import { Statistics } from '../components/Statistics';
import { WhyChoose } from '../components/WhyChoose';
import { FAQ } from '../components/FAQ';
import { CTA } from '../components/CTA';
import { Footer } from '../components/Footer';
export default function Landing() {
  return (
    <>
      <NavBar />
      <Hero />
      <TrustedBy />
      <Features />
      <Showcase />
      <Statistics />
      <WhyChoose />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}

