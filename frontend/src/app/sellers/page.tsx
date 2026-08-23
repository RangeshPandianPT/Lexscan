"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { SellerAnalytics } from "@/components/SellerAnalytics";

export default function SellersPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-content"
    >
      <Header
        title="Seller Intelligence Analytics"
        breadcrumbs={[{ label: "LexScan" }, { label: "Sellers" }]}
      />
      <div className="mt-5">
        <SellerAnalytics />
      </div>
    </motion.div>
  );
}
