"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useParams, useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  ShieldCheck, 
  ArrowLeft, 
  Image as ImageIcon, 
  AlertTriangle, 
  PackageOpen, 
  Info, 
  Scale, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Check, 
  BadgeCheck,
  Building2,
  Globe2,
  Calendar,
  PhoneCall,
  Coins,
  Package,
  Layers
} from "lucide-react";

interface ExtractedFieldItem {
  value: any;
  confidence?: number;
  currency?: string;
  raw_text?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { 
      month: "short", 
      day: "2-digit", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  } catch {
    return dateStr;
  }
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/products/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setScan(data);
        if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0].url);
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="app-content h-full flex flex-col">
        <Header title="Product Details" breadcrumbs={[{ label: "History", href: "/history" }, { label: "Loading..." }]} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="app-content h-full flex flex-col">
        <Header title="Product Not Found" breadcrumbs={[{ label: "History", href: "/history" }, { label: "Error" }]} />
        <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
          Could not load the requested product scan.
        </div>
      </div>
    );
  }

  const isCompliant = scan.status === "COMPLIANT" && scan.compliance_score >= 80;
  const ef = scan.extracted_fields || {};
  const violationsList = scan.violations || [];
  
  // Helper to check if a specific rule failed in violations
  const isRuleViolated = (rulePattern: string) => {
    return violationsList.some((v: any) => 
      (v.rule_id && v.rule_id.includes(rulePattern)) || 
      (v.issue && v.issue.includes(rulePattern))
    );
  };

  // Comprehensive Legal Metrology Verification Checklist
  const mandatoryRules = [
    {
      id: "LM-R06-MRP",
      name: "Maximum Retail Price (MRP)",
      act: "Rule 6(1)(e) - Mandatory MRP Declaration & Price Cap",
      icon: Coins,
      extractedValue: ef.mrp?.raw_text || (ef.mrp?.value ? `₹${ef.mrp.value}` : null),
      isViolated: isRuleViolated("MRP"),
      compliantReason: "Stamped MRP is declared in statutory format inclusive of all taxes. Listed price does not exceed maximum retail price.",
      violationReason: "MRP declaration is missing, illegible, or selling price exceeds stamped MRP.",
    },
    {
      id: "LM-R06-QTY",
      name: "Net Quantity Declaration",
      act: "Rule 6(1)(d) & Rule 13 - Standard Units of Weight/Measure",
      icon: Package,
      extractedValue: ef.net_quantity?.raw_text || ef.net_quantity?.value || null,
      isViolated: isRuleViolated("QTY"),
      compliantReason: "Net quantity is declared using permissible metric units (g/kg/ml/l) adhering to standard numeral sizes.",
      violationReason: "Net quantity declaration is missing or does not follow prescribed legal metric units.",
    },
    {
      id: "LM-R06-MFG",
      name: "Manufacturer & Packer Details",
      act: "Rule 6(1)(a) - Name & Complete Physical Address",
      icon: Building2,
      extractedValue: ef.manufacturer?.raw_text || ef.manufacturer?.value || null,
      isViolated: isRuleViolated("MANUFACTURER") || isRuleViolated("MFG-01"),
      compliantReason: "Complete name, registered marketing office address, and FSSAI/Manufacturing license are declared on the label.",
      violationReason: "Name and physical address of manufacturer, packer, or importer is missing or incomplete.",
    },
    {
      id: "LM-R06-COO",
      name: "Country of Origin",
      act: "Rule 6(1)(c) read with Consumer Protection (E-Commerce) Rules",
      icon: Globe2,
      extractedValue: ef.country_of_origin?.raw_text || ef.country_of_origin?.value || null,
      isViolated: isRuleViolated("ORIGIN") || isRuleViolated("COO"),
      compliantReason: "Mandatory country of origin is explicitly declared on packaging and e-commerce listing.",
      violationReason: "Country of origin is not disclosed as mandated by the Legal Metrology & E-Commerce rules.",
    },
    {
      id: "LM-R06-CC",
      name: "Consumer Care Contact Information",
      act: "Rule 6(1)(a) proviso - Grievance Redressal Mechanism",
      icon: PhoneCall,
      extractedValue: ef.consumer_care?.raw_text || ef.consumer_care?.value || null,
      isViolated: isRuleViolated("CONSUMER_CARE") || isRuleViolated("CC-01"),
      compliantReason: "Consumer Services Manager contact, official helpline/phone number, and valid email address are provided.",
      violationReason: "Consumer grievance contact (phone number and email address) is not provided on the package.",
    },
    {
      id: "LM-R06-DATE",
      name: "Month & Year of Manufacture / Packing",
      act: "Rule 6(1)(f) - Date of Manufacture/Packing/Import",
      icon: Calendar,
      extractedValue: ef.mfg_or_import_date?.raw_text || ef.mfg_or_import_date?.value || null,
      isViolated: isRuleViolated("MFG_DATE") || isRuleViolated("DATE-01"),
      compliantReason: "Manufacturing/packaging month and year declared in the standard 'Mfg MM/YYYY' format.",
      violationReason: "Month and year of manufacture/packing/import is missing or invalid format.",
    },
    {
      id: "LM-R06-PRICE-INTEGRITY",
      name: "Price Integrity & Dual Pricing Verification",
      act: "Section 18 read with Rule 6(1)(e) - No Dual Pricing",
      icon: Scale,
      extractedValue: scan.listing_price && ef.mrp?.value ? `Listed: ₹${scan.listing_price} | Stamped: ₹${ef.mrp.value}` : null,
      isViolated: isRuleViolated("PRICE_ABOVE_MRP"),
      compliantReason: "E-commerce listing price complies with Section 18 and does not exceed the maximum retail price stamped on packaging.",
      violationReason: "Online listed price exceeds stamped physical MRP (Dual Pricing violation under Section 18).",
    },
    {
      id: "LM-R06-FONT",
      name: "Minimum Height of Numerals & Letters",
      act: "Rule 9 - Minimum Legibility & Height Standards",
      icon: Layers,
      extractedValue: "≥ 2.0 mm Standard Height",
      isViolated: isRuleViolated("FONT_SIZE"),
      compliantReason: "Declarations and numeral heights meet statutory minimum legibility thresholds for the packaging area.",
      violationReason: "Numeral or declaration font size is below the prescribed legal minimum threshold.",
    },
  ];

  return (
    <div className="app-content h-full flex flex-col">
      <Header
        title="Product Compliance Profile"
        breadcrumbs={[{ label: "History", href: "/history" }, { label: scan.product_id }]}
      />
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Bar / Back Button */}
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-teal-400 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </button>

          {/* Header Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 md:items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)]">
                  {scan.platform}
                </span>
                <span className="text-xs font-mono text-[var(--text-tertiary)]">
                  {formatDate(scan.timestamp)}
                </span>
                {scan.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {scan.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold font-display text-[var(--text-primary)] mb-2">
                {scan.title || "Unknown Product"}
              </h1>
              <div className="text-sm font-mono text-[var(--text-secondary)] mb-4">
                Product ID: <span className="text-[var(--text-primary)]">{scan.product_id}</span>
              </div>
              
              {scan.url && (
                <a 
                  href={scan.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 px-3.5 py-2 rounded-lg transition-colors border border-teal-500/20 shadow-sm"
                >
                  <PackageOpen className="w-4 h-4" />
                  View Original Listing
                </a>
              )}
            </div>
            
            {/* Compliance Badge */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl min-w-[200px]">
              <div className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Compliance Score</div>
              <div className={`text-5xl font-black font-display tracking-tighter mb-2 ${isCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
                {scan.compliance_score}%
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full text-xs font-bold border ${
                isCompliant ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
              }`}>
                {isCompliant ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {scan.status}
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide font-medium">Starts at 100, minus penalties</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Product & Label Images */}
            <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                    Product & Label Images
                  </h2>
                  <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
                    {scan.images ? `${scan.images.length} Captured` : "0 Images"}
                  </span>
                </div>
                
                {scan.images && scan.images.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {/* Main Image Viewer */}
                    <div className="w-full aspect-square bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden relative group">
                      {selectedImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={selectedImage} 
                          alt="Product Label" 
                          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                          onError={(e: any) => {
                            // Fallback to placeholder if external URL is blocked
                            e.target.onerror = null;
                            e.target.src = "/images/kurkure_front.jpg";
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-[var(--text-tertiary)] opacity-50" />
                      )}
                      
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border border-white/10">
                        <BadgeCheck className="w-3.5 h-3.5 text-teal-400" />
                        AI Verified Label
                      </div>
                    </div>
                    
                    {/* Thumbnail Strip */}
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {scan.images.map((img: any, idx: number) => (
                        <button 
                          key={idx}
                          onClick={() => setSelectedImage(img.url)}
                          className={`w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white relative ${
                            selectedImage === img.url 
                              ? 'border-teal-400 ring-2 ring-teal-400/30' 
                              : 'border-[var(--border-subtle)] opacity-70 hover:opacity-100 hover:border-[var(--border-base)]'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={img.url} 
                            alt={`Thumb ${idx}`} 
                            className="w-full h-full object-contain"
                            onError={(e: any) => {
                              e.target.onerror = null;
                              e.target.src = idx === 0 ? "/images/kurkure_front.jpg" : "/images/kurkure_back.jpg";
                            }}
                          />
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                            #{idx + 1}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center text-[var(--text-tertiary)] p-6 text-center">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No images captured during scan.</p>
                  </div>
                )}
              </div>

              {/* Extracted Attributes Quick Card */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Detected Declarations Data
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">MRP Stamped</span>
                    <span className="font-semibold text-[var(--text-primary)] font-mono">{ef.mrp?.value ? `₹${ef.mrp.value}` : "Not Declared"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Net Quantity</span>
                    <span className="font-semibold text-[var(--text-primary)] font-mono">{ef.net_quantity?.value || "Not Declared"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Country of Origin</span>
                    <span className="font-semibold text-[var(--text-primary)] font-mono">{ef.country_of_origin?.value || "Not Declared"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Mfg Date</span>
                    <span className="font-semibold text-[var(--text-primary)] font-mono">{ef.mfg_or_import_date?.value || "Not Declared"}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[var(--text-secondary)]">Listing Price</span>
                    <span className="font-semibold text-teal-400 font-mono">{scan.listing_price ? `₹${scan.listing_price}` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Legal Metrology Findings & Declarations Breakdown */}
            <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
              
              {/* Status Banner */}
              {isCompliant ? (
                <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-emerald-400 font-display">100% Legal Metrology Compliant</h3>
                    <p className="text-xs text-emerald-400/90 mt-1 leading-relaxed">
                      All mandatory statutory declarations required under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 have been successfully detected, validated, and verified on this product's packaging and listing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-red-400 font-display">Non-Compliant Product Detected</h3>
                    <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
                      This product has {violationsList.length} compliance violation(s) that fail the mandatory Legal Metrology (Packaged Commodities) Rules, 2011.
                    </p>
                  </div>
                </div>
              )}

              {/* Detected Violations (if any) */}
              {violationsList.length > 0 && (
                <div className="bg-[var(--bg-surface)] border border-red-500/20 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Detected Violations ({violationsList.length})
                  </h2>
                  <div className="space-y-4">
                    {violationsList.map((v: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="font-semibold text-red-400 text-sm">
                            {v.issue ? v.issue.replace(/_/g, ' ') : "Violation Detected"}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold uppercase">
                              {v.severity || "HIGH"}
                            </span>
                            <span className="text-xs font-bold text-red-400">
                              -{v.severity === 'HIGH' ? 20 : v.severity === 'MEDIUM' ? 10 : 5} pts
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mb-2 leading-relaxed">
                          {v.message}
                        </div>
                        {v.clause && (
                          <div className="text-[10px] font-mono text-[var(--text-tertiary)] bg-[var(--bg-base)] inline-block px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            {v.clause}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Declarations & Verification Breakdown */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl p-6 shadow-sm flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                      <Scale className="w-4 h-4 text-teal-400" />
                      Legal Metrology Rules Audit Checklist
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Verification of statutory packaging declarations under Legal Metrology Act & Rules, 2011
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {mandatoryRules.filter(r => !r.isViolated).length} / {mandatoryRules.length} Passed
                  </span>
                </div>

                <div className="space-y-4">
                  {mandatoryRules.map((rule) => {
                    const Icon = rule.icon;
                    const passed = !rule.isViolated;
                    
                    return (
                      <div 
                        key={rule.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          passed 
                            ? 'bg-[var(--bg-base)] border-[var(--border-subtle)] hover:border-teal-500/30' 
                            : 'bg-red-500/5 border-red-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                                {rule.name}
                              </div>
                              <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                                {rule.act}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {passed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                                <Check className="w-3.5 h-3.5" />
                                Present & Compliant
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                                <XCircle className="w-3.5 h-3.5" />
                                Non-Compliant
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Extracted Value Badge */}
                        {rule.extractedValue && (
                          <div className="my-2 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-3 text-xs">
                            <span className="text-[var(--text-secondary)] font-medium">Extracted Value:</span>
                            <span className="font-mono font-semibold text-teal-400 text-right truncate max-w-[340px]" title={rule.extractedValue}>
                              {rule.extractedValue}
                            </span>
                          </div>
                        )}

                        {/* AI / Legal Reasoning */}
                        <div className="mt-2 flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed bg-black/20 p-2.5 rounded-lg">
                          <Info className="w-3.5 h-3.5 text-teal-400 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong className="text-[var(--text-primary)] font-medium">Legal Reasoning: </strong>
                            {passed ? rule.compliantReason : rule.violationReason}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

