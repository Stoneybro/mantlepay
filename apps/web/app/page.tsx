import Navigation from '@/components/home/Navigation';
import Hero from '@/components/home/Hero';
import Problem from '@/components/home/Problem';
import WhyMneePay from '@/components/home/WhyMneePay';
import Features from '@/components/home/Features';
import MneeStablecoin from '@/components/home/MneeStablecoin';
import HowItWorks from '@/components/home/HowItWorks';
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
      <WhyMneePay />
      <Features />
      <MneeStablecoin />
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
