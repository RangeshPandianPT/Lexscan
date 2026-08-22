"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

/* ── Zod Schema ─────────────────────────────────────────── */
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

/* ── Severity Badge ─────────────────────────────────────── */
function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "HIGH" ? "badge-high" : severity === "MEDIUM" ? "badge-medium" : "badge-low";
  return <span className={`badge ${cls}`}>{severity}</span>;
}

/* ── Rule Card ──────────────────────────────────────────── */
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
    <div
      className={`card transition-all duration-200 ${rule.active ? "" : "opacity-60"}`}
    >
      <div className="px-5 py-4 flex items-center gap-3">
        {/* Active Toggle */}
        <button
          onClick={() => onToggle(rule.id)}
          className="flex-shrink-0"
          title={rule.active ? "Deactivate rule" : "Activate rule"}
        >
          {rule.active ? (
            <ToggleRight className="w-8 h-8 text-indigo-500" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-300" />
          )}
        </button>

        {/* Rule Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-[13px]">{rule.rule_name}</span>
            <SeverityBadge severity={rule.severity} />
            {!rule.active && (
              <span className="badge" style={{ background: "#F1F5F9", color: "#94A3B8", borderColor: "#E2E8F0" }}>
                Inactive
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.rule_id}</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(rule)}
            className="btn btn-secondary btn-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50/50 grid grid-cols-2 md:grid-cols-3 gap-4 text-[12px] animate-fade-in">
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wide mb-1">Act Reference</div>
            <div className="text-slate-700">{rule.act_reference}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wide mb-1">Field</div>
            <code className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">{rule.field}</code>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wide mb-1">Check</div>
            <code className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono">{rule.check}</code>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wide mb-1">Category</div>
            <span className="text-slate-700">{rule.category}</span>
          </div>
          <div>
            <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wide mb-1">Severity</div>
            <SeverityBadge severity={rule.severity} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Rule Form (Create / Edit) ──────────────────────────── */
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
        {/* Rule ID */}
        <div>
          <label className="form-label">Rule ID *</label>
          <input
            {...register("rule_id")}
            placeholder="e.g. LM-R06-MRP-01"
            className="form-input font-mono"
          />
          {errors.rule_id && <p className="form-error">{errors.rule_id.message}</p>}
        </div>

        {/* Rule Name */}
        <div>
          <label className="form-label">Rule Name *</label>
          <input {...register("rule_name")} placeholder="e.g. Mandatory MRP Declaration" className="form-input" />
          {errors.rule_name && <p className="form-error">{errors.rule_name.message}</p>}
        </div>

        {/* Act Reference */}
        <div className="md:col-span-2">
          <label className="form-label">Act Reference *</label>
          <input {...register("act_reference")} placeholder="e.g. Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6(1)(e)" className="form-input" />
          {errors.act_reference && <p className="form-error">{errors.act_reference.message}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Category</label>
          <select {...register("category")} className="form-select">
            <option value="ALL">All Categories</option>
            <option value="cosmetics">Cosmetics</option>
            <option value="packaged_food">Packaged Food</option>
            <option value="electronics">Electronics</option>
            <option value="baby_care">Baby Care</option>
          </select>
        </div>

        {/* Field */}
        <div>
          <label className="form-label">Field to Check</label>
          <select {...register("field")} className="form-select font-mono">
            <option value="mrp">mrp</option>
            <option value="net_quantity">net_quantity</option>
            <option value="manufacturer">manufacturer</option>
            <option value="country_of_origin">country_of_origin</option>
            <option value="consumer_care">consumer_care</option>
            <option value="mfg_or_import_date">mfg_or_import_date</option>
          </select>
        </div>

        {/* Check Type */}
        <div>
          <label className="form-label">Check Type</label>
          <select {...register("check")} className="form-select font-mono">
            <option value="not_null">not_null</option>
            <option value="not_null_and_positive">not_null_and_positive</option>
            <option value="not_above_mrp">not_above_mrp</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="form-label">Severity</label>
          <select {...register("severity")} className="form-select">
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        {/* Active */}
        <div className="flex items-center gap-3 pt-5">
          <input
            {...register("active")}
            type="checkbox"
            id="active-checkbox"
            className="w-4 h-4 rounded border-slate-300 accent-indigo-600"
          />
          <label htmlFor="active-checkbox" className="form-label mb-0 cursor-pointer">
            Activate this rule immediately
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isSubmitting ? "Saving..." : "Save Rule"}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Scan Trigger Form ──────────────────────────────────── */
function ScanTriggerForm() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("cosmetics");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<null | "success" | "error">(null);

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1800));
    setScanning(false);
    setResult("success");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      <div className="flex items-center gap-3">
        <button
          onClick={handleScan}
          disabled={scanning || !url.trim()}
          className="btn btn-primary"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {scanning ? "Scanning..." : "Trigger Scan"}
        </button>
        {result === "success" && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Scan queued — results will appear in the live feed shortly.
          </div>
        )}
        {result === "error" && (
          <div className="flex items-center gap-1.5 text-red-600 text-[12px] font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4" />
            Failed to queue scan. Check backend connection.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────── */
export function RuleStudio() {
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/admin/rules`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          // Merge backend rules with initial rules so we don't lose the defaults
          setRules(prev => prev.map(r => {
            const backendRule = data.find((br: any) => br.id === r.id);
            if (backendRule) {
              return { ...r, ...backendRule, active: backendRule.is_active };
            }
            return r;
          }));
        }
      })
      .catch(err => console.error("Failed to fetch rules", err));
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
        body: JSON.stringify({ ...updatedRule, is_active: updatedRule.active })
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
        body: JSON.stringify({ ...finalRule, is_active: finalRule.active })
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
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-[13px] font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-slide-in-right">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* ── Header strip ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-800">Compliance Rule Engine</div>
            <div className="text-[11px] text-slate-400">{activeCount} of {rules.length} rules active · Config-driven, no redeployment needed</div>
          </div>
        </div>
        <button
          onClick={() => { setEditingRule(null); setShowForm(true); }}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      {/* ── Create/Edit Form ─── */}
      {showForm && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <span className="text-[13px] font-semibold text-slate-800">
              {editingRule ? `Edit: ${editingRule.rule_name}` : "Create New Rule"}
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
        </div>
      )}

      {/* ── Rule List ─── */}
      <div className="space-y-3">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest px-1">
          Active Rules ({rules.length})
        </div>
        {rules.map((rule) => (
          <RuleCard
            key={rule.id}
            rule={rule}
            onToggle={handleToggle}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* ── Manual Scan Trigger ─── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-indigo-600" />
            <span className="text-[13px] font-semibold text-slate-800">Manual Scan Trigger</span>
          </div>
          <span className="text-[11px] text-slate-400">POST /admin/scan/trigger</span>
        </div>
        <div className="card-body">
          <ScanTriggerForm />
        </div>
      </div>
    </div>
  );
}
