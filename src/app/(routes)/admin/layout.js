import AdminSide from "@/app/components/admin/AdminSide";

export default function SoloLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <AdminSide />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
