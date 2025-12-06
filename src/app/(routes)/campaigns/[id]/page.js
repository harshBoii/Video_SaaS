import CampaignPage from "@/app/components/campaign/CampaignPage";

export default async function CampaignsPage({ params }) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.id;
  
  return <CampaignPage campaignId={campaignId} />;
}
