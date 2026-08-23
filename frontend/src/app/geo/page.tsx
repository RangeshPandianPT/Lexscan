"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { GeoHeatmap } from "@/components/GeoHeatmap";

export default function GeoPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="app-content"
    >
      <Header
        title="Geographic Compliance Radar"
        breadcrumbs={[{ label: "LexScan" }, { label: "Geo Heatmap" }]}
      />
      <div className="mt-5">
        <GeoHeatmap />
      </div>
    </motion.div>
  );
}
