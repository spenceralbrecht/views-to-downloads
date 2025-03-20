import InfluencerVideoGallery from '../../components/InfluencerVideoGallery';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Influencer Videos | Views to Downloads',
  description: 'Browse and manage influencer videos with customizable tags',
};

export default function InfluencerVideosPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <InfluencerVideoGallery />
    </div>
  );
}
