import { Metadata } from 'next';
import ForYouFeed from '@/components/recommendations/ForYouFeed';

export const metadata: Metadata = {
  title: 'For You | Creators AI Compass',
  description: 'Personalized recommendations to accelerate your creator journey',
};

export default function ForYouPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <ForYouFeed />
    </div>
  );
}