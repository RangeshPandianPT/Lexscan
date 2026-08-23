"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { RuleStudio } from "@/components/RuleStudio";

export default function AdminPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-content"
    >
      <Header
        title="Compliance Rule Studio"
        breadcrumbs={[{ label: "LexScan" }, { label: "Admin" }, { label: "Rule Studio" }]}
      />
      <div className="mt-5">
        <RuleStudio />
      </div>
    </motion.div>
  );
}
