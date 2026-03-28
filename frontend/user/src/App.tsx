import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import QuickActions from "../components/QuickActions";
import AboutValues from "../components/AboutValues";
import MentorSection from "../components/MentorSection";
import BoardSection from "../components/BoardSection";
import FeaturedContent from "../components/FeaturedContent";
import LeaderboardPreview from "../components/LeaderboardPreview";
import ContributionSection from "../components/ContributionSection";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { getCurrentUser, type AuthUser } from "./services/auth.service";

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Fixed Navbar */}
      <Navbar user={user} onAuthSuccess={refreshUser} />

      {/* Main content */}
      <main className="flex-grow flex flex-col">
        <HeroSection />
        <QuickActions />
        <AboutValues />
        <MentorSection />
        <BoardSection />
        <FeaturedContent />
        <LeaderboardPreview />
        <ContributionSection />
        <FinalCTA />
      </main>

      <Footer />

      {/* Back to top button */}
      <BackToTop />
    </div>
  );
};

export default App;
