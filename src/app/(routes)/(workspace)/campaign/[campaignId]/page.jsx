import CampaignPage from '@/app/components/campaign/CampaignPage';

export default async function CampaignDetailPage({ params }) {
  const { campaignId: id } = await params;

  return <CampaignPage campaignId={id} />;
}
