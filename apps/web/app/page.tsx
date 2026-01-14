import Navigation from '@/components/home/Navigation';
import Hero from '@/components/home/Hero';
import Problem from '@/components/home/Problem';
import WhyMantlePay from '@/components/home/WhyMantlePay';
import Features from '@/components/home/Features';
import MantleStablecoin from '@/components/home/MantleStablecoin';
import { HowItWorks } from '@/components/home/HowItWorks';
import UseCases from '@/components/home/UseCases';
import WhyTeams from '@/components/home/WhyTeams';
import Technology from '@/components/home/Technology';
import FinalCTA from '@/components/home/FinalCTA';
import Footer from '@/components/home/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Problem />
      <WhyMantlePay />
      <Features />
      <MantleStablecoin />
      <HowItWorks />
      <UseCases />
      <WhyTeams />
      <Technology />
      <FinalCTA />
      <Footer />
    </div>
  );
}

export default App;
