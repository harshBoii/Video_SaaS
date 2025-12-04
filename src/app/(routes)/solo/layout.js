import SoloSide from "@/app/components/solo/SoloSide";

export default function SoloLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <SoloSide />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
