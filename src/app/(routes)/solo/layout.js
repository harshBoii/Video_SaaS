"use client"; 
import SoloSide from "@/app/components/solo/SoloSide";
import { useSoloAuth } from "./soloAuth";

export default function SoloLayout({ children }) {
  // const { user, loading } = useSoloAuth();
  
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-gray-50">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Verifying access...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) return null;

  return (
    <div style={{ display: "flex" }}>
      <SoloSide />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
