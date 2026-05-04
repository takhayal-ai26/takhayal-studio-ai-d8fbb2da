import { render, screen } from '@testing-library/react';
import { Sparkles } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import PortalHome from './PortalHome';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
}));

vi.mock('@/context/AppContext', () => ({
  useApp: () => ({ openAuthModal: vi.fn() }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'en',
    isRTL: false,
    t: {
      portal: {
        all: 'All',
        whatWillYouCreate: 'What will you',
        createToday: 'create today?',
        toolsIntro: 'Explore tools',
        exploreAllTools: 'Explore all tools',
        generateVideo: 'Generate Video',
        generateVideoDesc: 'Create videos from text or image',
        startFromPowerful: 'Start from powerful templates',
        readyMadePrompts: 'Ready-made prompts',
        exploreAllTemplates: 'Explore all templates',
        needMoreInspiration: 'Need more inspiration?',
        exploreTemplates: 'Explore templates',
        use: 'Use',
        communityWorks: 'Community works',
        seeWhatCreators: 'See what creators made',
        exploreCommunity: 'Explore community',
        exploreCommunityTitle: 'Explore community',
        exploreCommunityDesc: 'Browse community posts',
        exploreMoreCommunity: 'Explore more community',
        goToCommunity: 'Go to community',
      },
    },
  }),
}));

vi.mock('@/hooks/useTemplates', () => ({
  useTemplates: () => ({ templates: [], categories: [] }),
}));

vi.mock('@/hooks/useTools', () => ({
  useTools: () => ({
    featuredTools: ['featured-image', 'generate-video'],
    tools: [
      {
        id: 'featured-image',
        name: 'Featured Image',
        description: '',
        shortDesc: 'Shown on home',
        image: '/featured.jpg',
        route: '/tools/featured-image',
        icon: Sparkles,
        inputType: 'prompt',
        heroTagline: '',
        creditCost: 1,
        options: [],
        examples: [],
      },
      {
        id: 'hidden-image',
        name: 'Hidden Image',
        description: '',
        shortDesc: 'Hidden from home',
        image: '/hidden.jpg',
        route: '/tools/hidden-image',
        icon: Sparkles,
        inputType: 'prompt',
        heroTagline: '',
        creditCost: 1,
        options: [],
        examples: [],
      },
      {
        id: 'generate-video',
        name: 'Generate Video',
        description: '',
        shortDesc: 'Create videos from text or image',
        image: '/video-cover.jpg',
        route: '/video/generate-video',
        icon: Sparkles,
        inputType: 'prompt',
        heroTagline: '',
        creditCost: 25,
        options: [],
        examples: [],
      },
    ],
  }),
}));

vi.mock('@/components/home/DashboardHero', () => ({ DashboardHero: () => <div /> }));
vi.mock('@/components/home/WhyTakhayal', () => ({ WhyTakhayal: () => <div /> }));
vi.mock('@/components/home/FinalCTA', () => ({ FinalCTA: () => <div /> }));
vi.mock('@/components/home/ContinueWhereLeftOff', () => ({ ContinueWhereLeftOff: () => <div /> }));
vi.mock('@/components/home/WelcomeBack', () => ({ WelcomeBack: () => <div /> }));
vi.mock('@/components/home/ExploreModels', () => ({ ExploreModels: () => <div /> }));
vi.mock('@/components/home/QuickActions', () => ({ QuickActions: () => <div /> }));
vi.mock('@/components/layout/Footer', () => ({ Footer: () => <div /> }));
vi.mock('@/components/seo/PageSeo', () => ({ PageSeo: () => null }));
vi.mock('@/components/cms/CmsContentBlocks', () => ({ CmsContentBlocks: () => null }));
vi.mock('@/components/home/TestimonialsCarousel', () => ({ TestimonialsCarousel: () => <div /> }));
vi.mock('@/components/home/PricingPreview', () => ({ PricingPreview: () => <div /> }));

describe('PortalHome tools section', () => {
  it('uses featured tools as the What will you create today visibility toggle', () => {
    render(<PortalHome />);

    expect(screen.getByText('Featured Image')).toBeInTheDocument();
    expect(screen.getByText('Generate Video')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Image')).not.toBeInTheDocument();
    expect(screen.getAllByText('Generate Video')).toHaveLength(1);
  });
});
