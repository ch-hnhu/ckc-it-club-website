import HeroSection from "@/components/landing-page/HeroSection";
import QuickActions from "@/components/landing-page/QuickActions";
import AboutValues from "@/components/landing-page/AboutValues";
import MentorSection from "@/components/landing-page/MentorSection";
import BoardSection from "@/components/landing-page/BoardSection";
import FeaturedContent from "@/components/landing-page/FeaturedContent";
import LeaderboardPreview from "@/components/landing-page/LeaderboardPreview";
import ContributionSection from "@/components/landing-page/ContributionSection";
import FinalCTA from "@/components/landing-page/FinalCTA";

const LandingPage: React.FC = () => {
	return (
		<>
			<HeroSection />
			<QuickActions />
			<AboutValues />
			<MentorSection />
			<BoardSection />
			<FeaturedContent />
			<LeaderboardPreview />
			<ContributionSection />
			<FinalCTA />
		</>
	);
};

export default LandingPage;
