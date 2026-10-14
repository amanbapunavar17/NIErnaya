import React, { useState } from 'react';
import { CinematicLoader } from '../../components/common/CinematicLoader';
import { AnnouncementTicker } from '../../components/navigation/AnnouncementTicker';
import { Navbar } from '../../components/navigation/Navbar';

import { Hero } from '../../sections/public/Hero/Hero';
import { LiveStats } from '../../sections/public/Stats/LiveStats';
import { About } from '../../sections/public/About/About';
import { Mission } from '../../sections/public/Mission/Mission';

import { Phases } from '../../sections/public/Phases/Phases';
import { DynamicTimeline } from '../../sections/public/Timeline/DynamicTimeline';
import { Eligibility } from '../../sections/public/Eligibility/Eligibility';
import { CampusInfo } from '../../sections/public/CampusInfo/CampusInfo';
import { Rules } from '../../sections/public/Rules/Rules';
import { Prizes } from '../../sections/public/Prizes/Prizes';
import { FAQ } from '../../sections/public/FAQ/FAQ';
import { Organizers } from '../../sections/public/Organizers/Organizers';
import { CommunityCTA } from '../../sections/public/Community/CommunityCTA';
import { ResultsSection } from '../../sections/public/Results/ResultsSection';
import { Contact } from '../../sections/public/Contact/Contact';
import { Footer } from '../../sections/public/Footer/Footer';

export const LandingPage: React.FC = () => {
  const [loadingComplete, setLoadingComplete] = useState(false);

  return (
    <div className="min-h-screen bg-[#07090D] text-[#F5F7FA] relative selection:bg-[#36D9FF]/30 selection:text-[#36D9FF]">
      {!loadingComplete && (
        <CinematicLoader
          onComplete={() => setLoadingComplete(true)}
        />
      )}

      <AnnouncementTicker />

      <Navbar />

      <main>
        <Hero />

        <LiveStats />

        <About />

        {/* NEW — Academic mission / course outcomes */}
        <Mission />

        <Phases />

        <DynamicTimeline />

        <Eligibility />

        <CampusInfo />

        <Rules />


        <Prizes />

        <CommunityCTA />

        <Organizers />

        <FAQ />

        <ResultsSection />

        <Contact />
      </main>

      <Footer />
    </div>
  );
};