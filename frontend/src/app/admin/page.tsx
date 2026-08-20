import { Header } from "@/components/Header";
import { RuleStudio } from "@/components/RuleStudio";

export default function AdminPage() {
  return (
    <div className="app-content animate-fade-in">
      <Header
        title="Rule Studio"
        breadcrumbs={[{ label: "LexScan" }, { label: "Admin" }, { label: "Rule Studio" }]}
      />
      <div className="mt-5">
        <RuleStudio />
      </div>
    </div>
  );
}
