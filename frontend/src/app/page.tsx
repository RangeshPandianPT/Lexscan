import { Header } from "@/components/Header";
import { OverviewDashboard } from "@/components/OverviewDashboard";

export default function HomePage() {
  return (
    <div className="app-content animate-fade-in">
      <Header
        title="Overview"
        breadcrumbs={[{ label: "LexScan" }, { label: "Overview" }]}
      />
      <OverviewDashboard />
    </div>
  );
}
