"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { OverviewDashboard } from "@/components/OverviewDashboard";

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-content"
    >
      <Header
        title="Overview Command Center"
        breadcrumbs={[{ label: "LexScan" }, { label: "Overview" }]}
      />
      <OverviewDashboard />
    </motion.div>
  );
}
