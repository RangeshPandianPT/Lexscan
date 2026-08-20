import { Header } from "@/components/Header";
import { SellerAnalytics } from "@/components/SellerAnalytics";

export default function SellersPage() {
  return (
    <div className="app-content animate-fade-in">
      <Header
        title="Seller Analytics"
        breadcrumbs={[{ label: "LexScan" }, { label: "Sellers" }]}
      />
      <div className="mt-5">
        <SellerAnalytics />
      </div>
    </div>
  );
}
