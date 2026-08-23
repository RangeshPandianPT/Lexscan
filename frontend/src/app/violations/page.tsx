"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ViolationExplorer } from "@/components/ViolationExplorer";

export default function ViolationsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-content"
    >
      <Header
        title="Violation Intelligence Explorer"
        breadcrumbs={[{ label: "LexScan" }, { label: "Violations" }]}
      />
      <div className="mt-5">
        <ViolationExplorer />
      </div>
    </motion.div>
  );
}
