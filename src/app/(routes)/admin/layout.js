"use client"; 
import AdminSide from "@/app/components/admin/AdminSide";
import { useAdminAuth } from "./adminAuth";

export default function AdminLayout({ children }) {
  const { user, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex" }}>
      <AdminSide /> 
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
