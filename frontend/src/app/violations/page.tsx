import { Header } from "@/components/Header";
import { ViolationExplorer } from "@/components/ViolationExplorer";

export default function ViolationsPage() {
  return (
    <div className="app-content animate-fade-in">
      <Header
        title="Violation Explorer"
        breadcrumbs={[{ label: "LexScan" }, { label: "Violations" }]}
      />
      <div className="mt-5">
        <ViolationExplorer />
      </div>
    </div>
  );
}
