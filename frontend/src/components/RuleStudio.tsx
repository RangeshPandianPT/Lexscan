"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  ScanLine,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

const ruleSchema = z.object({
  rule_id: z
    .string()
    .min(4, "Rule ID must be at least 4 characters")
    .regex(/^[A-Z0-9-]+$/, "Only uppercase letters, digits, and hyphens"),
  rule_name: z.string().min(5, "Rule name must be at least 5 characters"),
  act_reference: z.string().min(10, "Please include the act reference"),
  category: z.enum(["ALL", "cosmetics", "packaged_food", "electronics", "baby_care"]),
  field: z.enum(["mrp", "net_quantity", "manufacturer", "country_of_origin", "consumer_care", "mfg_or_import_date"]),
  check: z.enum(["not_null", "not_null_and_positive", "not_above_mrp"]),
  severity: z.enum(["HIGH", "MEDIUM", "LOW"]),
  active: z.boolean(),
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface Rule extends RuleFormData {
  id: string;
}

const INITIAL_RULES: Rule[] = [
  {
    id: "1",
    rule_id: "LM-R06-MRP-01",
    rule_name: "Mandatory MRP Declaration",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)",
    category: "ALL",
    field: "mrp",
    check: "not_null_and_positive",
    severity: "HIGH",
    active: true,
  },
  {
    id: "2",
    rule_id: "LM-R06-NQ-02",
    rule_name: "Net Quantity Declaration",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(b)",
    category: "ALL",
    field: "net_quantity",
    check: "not_null",
    severity: "MEDIUM",
    active: true,
  },
  {
    id: "3",
    rule_id: "LM-R06-MFR-03",
    rule_name: "Manufacturer Name and Address",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(c)",
    category: "ALL",
    field: "manufacturer",
    check: "not_null",
    severity: "HIGH",
    active: true,
  },
  {
    id: "4",
    rule_id: "LM-R06-CC-04",
    rule_name: "Consumer Care Contact",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(f)",
    category: "ALL",
    field: "consumer_care",
    check: "not_null",
    severity: "MEDIUM",
    active: true,
  },
  {
    id: "5",
    rule_id: "LM-R06-COO-05",
    rule_name: "Country of Origin",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(d)",
    category: "ALL",
    field: "country_of_origin",
    check: "not_null",
    severity: "LOW",
    active: true,
  },
  {
    id: "6",
    rule_id: "LM-R06-MFD-06",
    rule_name: "Manufacturing / Import Date",
    act_reference: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(g)",
    category: "ALL",
    field: "mfg_or_import_date",
    check: "not_null",
    severity: "MEDIUM",
    active: false,
  },
];

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "HIGH" ? "badge-high" : severity === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

function RuleCard({
  rule,
  onToggle,
  onEdit,
}: {
  rule: Rule;
  onToggle: (id: string) => void;
  onEdit: (rule: Rule) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`card transition-all duration-200 ${rule.active ? "" : "opacity-60"}`}>
      <div className="px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => onToggle(rule.id)}
          className="flex-shrink-0 text-teal-400 hover:scale-110 transition-transform"
          title={rule.active ? "Deactivate rule" : "Activate rule"}
        >
          {rule.active ? (
            <ToggleRight className="w-8 h-8 text-teal-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-[var(--text-tertiary)]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-bold font-display text-sm text-[var(--text-primary)]">{rule.rule_name}</span>
            <SeverityBadge severity={rule.severity} />
            {!rule.active && (
              <span className="badge" style={{ background: "var(--bg-subtle)", color: "var(--text-tertiary)", borderColor: "var(--border-subtle)" }}>
                Disabled
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] font-mono mt-0.5">{rule.rule_id}</div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => onEdit(rule)} className="btn btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-[var(--text-tertiary)]"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border-base)] px-6 py-4 bg-[var(--bg-subtle)] grid grid-cols-2 md:grid-cols-3 gap-4 text-xs overflow-hidden"
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Act Reference</div>
              <div className="text-[var(--text-primary)] font-medium">{rule.act_reference}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Target Field</div>
              <code className="text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono font-bold">{rule.field}</code>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Evaluation Logic</div>
              <code className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-mono font-bold">{rule.check}</code>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Category Scope</div>
              <span className="text-[var(--text-primary)] font-medium uppercase font-mono">{rule.category}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RuleForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  defaultValues?: Partial<RuleFormData>;
  onSubmit: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      active: true,
      category: "ALL",
      severity: "HIGH",
      check: "not_null",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Rule ID *</label>
          <input {...register("rule_id")} placeholder="e.g. LM-R06-MRP-01" className="form-input font-mono" />
          {errors.rule_id && <p className="form-error">{errors.rule_id.message}</p>}
        </div>

        <div>
          <label className="form-label">Rule Name *</label>
          <input {...register("rule_name")} placeholder="e.g. Mandatory MRP Declaration" className="form-input" />
          {errors.rule_name && <p className="form-error">{errors.rule_name.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="form-label">Act Reference *</label>
          <input {...register("act_reference")} placeholder="e.g. Legal Metrology (Packaged Commodities) Rules, 2011" className="form-input" />
          {errors.act_reference && <p className="form-error">{errors.act_reference.message}</p>}
        </div>

        <div>
          <label className="form-label">Category</label>
          <select {...register("category")} className="form-select">
            <option value="ALL font-bold">All Categories</option>
            <option value="cosmetics">Cosmetics</option>
            <option value="packaged_food">Packaged Food</option>
            <option value="electronics">Electronics</option>
            <option value="baby_care">Baby Care</option>
          </select>
        </div>

        <div>
          <label className="form-label">Target Field</label>
          <select {...register("field")} className="form-select font-mono">
            <option value="mrp">mrp</option>
            <option value="net_quantity">net_quantity</option>
            <option value="manufacturer">manufacturer</option>
            <option value="country_of_origin">country_of_origin</option>
            <option value="consumer_care">consumer_care</option>
            <option value="mfg_or_import_date">mfg_or_import_date</option>
          </select>
        </div>

        <div>
          <label className="form-label">Check Type</label>
          <select {...register("check")} className="form-select font-mono">
            <option value="not_null">not_null</option>
            <option value="not_null_and_positive">not_null_and_positive</option>
            <option value="not_above_mrp">not_above_mrp</option>
          </select>
        </div>

        <div>
          <label className="form-label">Severity Level</label>
          <select {...register("severity")} className="form-select">
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <input {...register("active")} type="checkbox" id="active-cb" className="w-4 h-4 rounded accent-teal-500" />
          <label htmlFor="active-cb" className="form-label mb-0 cursor-pointer">
            Activate rule immediately
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {isSubmitting ? "Saving..." : "Save Rule"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

interface ScanTriggerResult {
  product_name: string;
  platform: string;
  compliance_score: number;
  status: string;
  violations: Array<{ issue: string; severity: string }>;
}

function ScanTriggerForm() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("cosmetics");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | "success" | "error">(null);
  const [scanData, setScanData] = useState<ScanTriggerResult | null>(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setScanData(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/scan/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category })
      });
      
      if (!response.ok) throw new Error("Failed to trigger scan");
      const realData = await response.json();
      setResult("success");
      setScanData({
        product_name: realData.title || "Scanned Product",
        platform: realData.platform || "Unknown",
        compliance_score: realData.compliance_score || 0,
        status: realData.status || "NON_COMPLIANT",
        violations: realData.violations || []
      });
    } catch (e) {
      console.error(e);
      setResult("error");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="form-label">Product URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://amazon.in/dp/B09XYZ123"
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
            <option value="cosmetics">Cosmetics</option>
            <option value="packaged_food">Packaged Food</option>
            <option value="electronics">Electronics</option>
            <option value="baby_care">Baby Care</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={handleScan} disabled={scanning || !url.trim()} className="btn btn-primary">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {scanning ? "Triggering Scan Engine..." : "Trigger Manual Scan"}
        </button>
        {result === "success" && !scanData && (
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Scan queued — results will appear shortly in the Threat Radar ticker.
          </div>
        )}
        {result === "error" && (
          <div className="flex items-center gap-2 text-rose-500 text-xs font-semibold">
            <AlertCircle className="w-4 h-4" />
            Failed to connect to backend engine.
          </div>
        )}
      </div>

      {scanData && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 border border-rose-500/30 bg-rose-500/10 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {scanData.status}
                </span>
                <span className="text-xs text-[var(--text-tertiary)] font-bold uppercase">{scanData.platform}</span>
              </div>
              <h3 className="text-base font-bold font-display text-[var(--text-primary)]">{scanData.product_name}</h3>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black font-display text-rose-500 leading-none">{scanData.compliance_score}%</div>
              <div className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-wider mt-1">Compliance Score</div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-rose-500/20">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
              Detected Rule Violations ({scanData.violations.length})
            </div>
            <div className="space-y-2">
              {scanData.violations.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[var(--bg-surface)] px-4 py-2.5 rounded-xl border border-[var(--border-base)]">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold font-mono text-[var(--text-primary)]">{v.issue}</span>
                  </div>
                  <span className="badge badge-high">{v.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function RuleStudio() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/rules`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRules((prev) =>
            prev.map((r) => {
              const backendRule = data.find((br: { id: string; is_active?: boolean }) => br.id === r.id);
              if (backendRule) {
                return { ...r, ...backendRule, active: !!backendRule.is_active };
              }
              return r;
            })
          );
        }
      })
      .catch((err) => console.error("Failed to fetch rules", err));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    const updatedRule = { ...rule, active: !rule.active };
    setRules((rs) => rs.map((r) => (r.id === id ? updatedRule : r)));

    try {
      await fetch(`${API_BASE_URL}/admin/rules/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedRule, is_active: updatedRule.active }),
      });
    } catch (e) {
      console.error("Failed to sync toggle", e);
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleSubmit = async (data: RuleFormData) => {
    setIsSubmitting(true);
    const ruleId = editingRule ? editingRule.id : Date.now().toString();
    const finalRule = { ...data, id: ruleId };

    try {
      await fetch(`${API_BASE_URL}/admin/rules/${ruleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...finalRule, is_active: finalRule.active }),
      });

      if (editingRule) {
        setRules((rs) => rs.map((r) => (r.id === ruleId ? finalRule : r)));
        showToast("Rule updated successfully.");
      } else {
        setRules((rs) => [...rs, finalRule]);
        showToast("New rule created successfully.");
      }
    } catch (e) {
      console.error("Failed to save rule", e);
      showToast("Error saving rule to backend");
    }

    setIsSubmitting(false);
    setShowForm(false);
    setEditingRule(null);
  };

  const activeCount = rules.filter((r) => r.active).length;

  return (
    <div className="space-y-6 select-none">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[var(--bg-elevated)] border border-emerald-500/40 text-[var(--text-primary)] text-xs font-semibold px-4 py-3 rounded-2xl shadow-elevated flex items-center gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Strip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-glow">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-base font-bold font-display text-[var(--text-primary)]">Legal Compliance Rule Engine</h2>
            <p className="text-xs text-[var(--text-tertiary)]">{activeCount} of {rules.length} active rules · Dynamic evaluation without redeployment</p>
          </div>
        </div>
        <button onClick={() => { setEditingRule(null); setShowForm(true); }} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="card-header">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              {editingRule ? `Edit: ${editingRule.rule_name}` : "Construct New Compliance Rule"}
            </span>
          </div>
          <div className="card-body">
            <RuleForm
              defaultValues={editingRule ?? undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setShowForm(false); setEditingRule(null); }}
              isSubmitting={isSubmitting}
            />
          </div>
        </motion.div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] px-1">
          Configured Rules ({rules.length})
        </div>
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} onToggle={handleToggle} onEdit={handleEdit} />
        ))}
      </div>

      {/* Manual Trigger */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2.5">
            <ScanLine className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold font-display uppercase tracking-wider text-[var(--text-primary)]">
              On-Demand Compliance Scanner
            </span>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)]">POST /admin/scan/trigger</span>
        </div>
        <div className="card-body">
          <ScanTriggerForm />
        </div>
      </div>
    </div>
  );
}
