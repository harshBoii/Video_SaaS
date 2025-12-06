import CampaignDetailContent from "./content";

export default async function CampaignDetailPage({ params }) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.id;
  
  return <CampaignDetailContent campaignId={campaignId} />;
}
