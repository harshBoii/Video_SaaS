import PublicCollectionPage from "./content";

export default async function PublicCollection({ params }) {
  const resolvedParams = await params;
  const collectionId = resolvedParams.id;
  
  return <PublicCollectionPage collectionId={collectionId} />;
}
