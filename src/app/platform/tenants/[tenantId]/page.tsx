"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { DropdownMenu } from "@/components/DropdownMenu";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Plus, MoreHorizontal, Pencil, Trash2, Key, Globe, Building2, DollarSign, Users, Sparkles, Gauge, AlertTriangle, ExternalLink } from "lucide-react";
import {
  platformApi,
  type TenantSubscriptionDetail,
  type TenantDetail,
  type TenantUser,
  type FeatureCatalogItem,
  type LimitCatalogItem,
  type PlanCatalogItem,
} from "../../service/platformApi";
import { formatDateTimeLondon } from "@/lib/dateUtils";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params?.tenantId as string;
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [detail, setDetail] = useState<TenantSubscriptionDetail | null>(null);
  const [features, setFeatures] = useState<FeatureCatalogItem[]>([]);
  const [limits, setLimits] = useState<LimitCatalogItem[]>([]);
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [subscriptionMode, setSubscriptionMode] = useState<"plan" | "custom">("plan");
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);
  const [planKey, setPlanKey] = useState("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState("");
  const [subscriptionExpireDate, setSubscriptionExpireDate] = useState("");
  const [overrides, setOverrides] = useState<{ features: Record<string, boolean>; limits: Record<string, number | null> }>({ features: {}, limits: {} });
  const [userMenuOpenId, setUserMenuOpenId] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<TenantUser | null>(null);
  const [deleteTenantConfirm, setDeleteTenantConfirm] = useState(false);
  const [openingTenant, setOpeningTenant] = useState(false);
  const rowMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAmount, setBillingAmount] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState("GBP");
  const [status, setStatus] = useState("active");

  function loadUsers() { if (!tenantId) return; platformApi.listTenantUsers(tenantId).then(setUsers).catch(() => setUsers([])); }

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    Promise.all([
      platformApi.getTenant(tenantId).catch(() => null),
      platformApi.getTenantSubscription(tenantId),
      platformApi.getFeatureCatalog(false),
      platformApi.getLimitCatalog(false),
      platformApi.listTenantUsers(tenantId).catch(() => []),
      platformApi.getPlanCatalog(true).catch(() => []),
    ]).then(([t, sub, feats, lims, userList, planList]) => {
      if (t) { setTenant(t); setName(t.name || ""); setCompanyName(t.companyName || ""); setEmail(t.email || ""); setPhone(t.phone || ""); setBillingAddress(t.billingAddress || ""); setBillingEmail(t.billingEmail || ""); setBillingAmount(t.billingAmount != null ? String(t.billingAmount) : ""); setBillingCycle(t.billingCycle || "monthly"); setCurrency(t.currency || "GBP"); setStatus(t.status || "active"); }
      setDetail(sub); setFeatures(feats); setLimits(lims); setUsers(Array.isArray(userList) ? userList : []); setPlans(Array.isArray(planList) ? planList : []);
      setPlanKey(sub.planKey || ""); setSubscriptionStartDate(sub.startDate ? new Date(sub.startDate).toISOString().slice(0, 10) : ""); setSubscriptionExpireDate(sub.expireDate ? new Date(sub.expireDate).toISOString().slice(0, 10) : "");
      setOverrides({ features: sub.overrides?.features || {}, limits: sub.overrides?.limits || {} }); setSubscriptionMode(sub.subscriptionType === "custom" ? "custom" : "plan");
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed to load")).finally(() => setLoading(false));
  }, [tenantId]);

  const buildOverridesForSave = () => {
    // The Sales/Invoice dropdown is a derived control: even when the user didn't fire onChange
    // (because the displayed value already matches the effective state), the save must always
    // commit the dropdown's current selection so the override is explicit on the server.
    const features = { ...overrides.features };
    if (salesInvoiceMode === "sales") { features.sales = true; features.invoices = false; }
    else if (salesInvoiceMode === "invoices") { features.sales = false; features.invoices = true; }
    else { features.sales = false; features.invoices = false; }
    return { ...overrides, features };
  };
  const handleSaveSubscription = async () => { if (!tenantId) return; setSaving(true); try { const overridesToSave = buildOverridesForSave(); const updated = await platformApi.updateTenantSubscription(tenantId, { subscriptionType: "plan", planKey, overrides: overridesToSave, salesInvoiceMode, startDate: subscriptionStartDate || null, expireDate: subscriptionExpireDate || null }); setDetail(updated); setOverrides({ features: updated.overrides.features, limits: updated.overrides.limits }); setSubscriptionStartDate(updated.startDate ? new Date(updated.startDate).toISOString().slice(0, 10) : ""); setSubscriptionExpireDate(updated.expireDate ? new Date(updated.expireDate).toISOString().slice(0, 10) : ""); setSubscriptionMode("plan"); setToast({ message: "Subscription saved" }); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true }); } finally { setSaving(false); } };
  const handleSaveTenantDetails = async () => { if (!tenantId) return; setSaving(true); try { await platformApi.updateTenant(tenantId, { name: name.trim(), companyName: companyName.trim(), email: email.trim(), phone: phone.trim(), billingAddress: billingAddress.trim() }); setToast({ message: "Tenant details saved" }); const t = await platformApi.getTenant(tenantId); setTenant(t); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true }); } finally { setSaving(false); } };
  const handleSaveCustomBilling = async () => { if (!tenantId) return; setSaving(true); try { await platformApi.updateTenant(tenantId, { billingEmail: billingEmail.trim(), billingAmount: billingAmount === "" ? null : Number(billingAmount), billingCycle, currency: currency.trim() || "GBP", status }); const overridesToSave = buildOverridesForSave(); const updated = await platformApi.updateTenantSubscription(tenantId, { subscriptionType: "custom", planKey: "", overrides: overridesToSave, salesInvoiceMode, startDate: subscriptionStartDate || null, expireDate: subscriptionExpireDate || null }); setDetail(updated); setPlanKey(""); setSubscriptionMode("custom"); setToast({ message: "Custom billing saved" }); const t = await platformApi.getTenant(tenantId); setTenant(t); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to save", error: true }); } finally { setSaving(false); } };

  const setFeatureOverride = (key: string, value: boolean | undefined) => { setOverrides((prev) => { const next = { ...prev, features: { ...prev.features } }; if (value === undefined) delete next.features[key]; else next.features[key] = value; return next; }); };
  const setSalesInvoiceMode = (mode: "none" | "sales" | "invoices") => {
    setOverrides((prev) => ({
      ...prev,
      features: { ...prev.features, sales: mode === "sales", invoices: mode === "invoices" },
    }));
  };
  const setLimitOverride = (key: string, value: number | null) => { setOverrides((prev) => ({ ...prev, limits: { ...prev.limits, [key]: value } })); };
  const handleConfirmDeleteTenant = async () => { if (!tenantId) return; try { await platformApi.deleteTenant(tenantId); setToast({ message: "Tenant deleted" }); router.push("/platform/tenants"); } catch (err) { setToast({ message: err instanceof Error ? err.message : "Failed to delete tenant", error: true }); setDeleteTenantConfirm(false); } };
  const handleConfirmDeleteUser = async () => { if (!tenantId || !deleteUserConfirm) return; try { await platformApi.deleteTenantUser(tenantId, deleteUserConfirm._id); setToast({ message: "User deleted" }); loadUsers(); } catch (err) { setToast({ message: err instanceof Error ? err.message : "Failed to delete", error: true }); } setDeleteUserConfirm(null); };

  if (loading || !tenantId) return <div className="flex items-center justify-center py-20 gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>;
  if (error && !detail) return <div className="max-w-xl mx-auto mt-12 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}<Link href="/platform/tenants" className="block mt-2 text-orange-600 hover:underline">Back to Tenants</Link></div>;

  const effectiveFeatures = detail?.effective?.enabledFeatures || {};
  const effectiveLimits = detail?.effective?.limits || {};
  const usage = detail?.usage || {};
  const sym = currency === "EUR" ? "\u20AC" : currency === "USD" ? "$" : "\u00A3";
  const isSuspended = status === "suspended";

  // Sales & Invoices are mutually exclusive — controlled together via a single dropdown.
  const SALES_INVOICE_KEYS = new Set(["sales", "invoices"]);
  const salesInvoiceMode: "none" | "sales" | "invoices" = (() => {
    const ovSales = overrides.features.sales;
    const ovInv = overrides.features.invoices;
    if (ovSales === true) return "sales";
    if (ovInv === true) return "invoices";
    if (ovSales === false && ovInv === false) return "none";
    if (effectiveFeatures.sales) return "sales";
    if (effectiveFeatures.invoices) return "invoices";
    return "none";
  })();

  return (
    <div className="max-w-4xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm ${toast.error ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          {toast.message}<button className="ml-2 font-bold" onClick={() => setToast(null)}>x</button>
        </div>
      )}

      {/* Back + Header */}
      <div className="mb-5"><Link href="/platform/tenants" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors"><ArrowLeft className="h-4 w-4" /> Back to Tenants</Link></div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex w-10 h-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm"><Building2 className="h-5 w-5" /></span>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{name || tenantId}</h1>
            <p className="text-xs font-mono text-gray-400">{tenantId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{isSuspended ? "Suspended" : "Active"}</span>
          <button type="button" onClick={async () => { const newStatus = status === "active" ? "suspended" : "active"; setSaving(true); try { await platformApi.updateTenant(tenantId, { status: newStatus }); setStatus(newStatus); setToast({ message: newStatus === "suspended" ? "Tenant account disabled" : "Tenant account enabled" }); const t = await platformApi.getTenant(tenantId); setTenant(t); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to update", error: true }); } finally { setSaving(false); } }} disabled={saving} className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${isSuspended ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300" : "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"}`}>
            {isSuspended ? "Enable account" : "Disable account"}
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {/* ─── Subdomain & URL ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-emerald-500" /><h2 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5"><Globe className="h-4 w-4" /> Subdomain & URL</h2>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {tenant?.tenantSubdomain && <div><p className="text-xs text-gray-400">Subdomain</p><p className="font-mono text-gray-800">{tenant.tenantSubdomain}</p></div>}
              {tenant?.tenantUrl && <div><p className="text-xs text-gray-400">URL</p><a href={tenant.tenantUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-orange-600 hover:underline inline-flex items-center gap-1"><ExternalLink className="h-3 w-3" />{tenant.tenantUrl}</a></div>}
              <div><p className="text-xs text-gray-400">Database</p><p className="font-mono text-gray-600">tenant_{tenantId}</p></div>
            </div>
            <div className="mt-3">
              <button type="button" onClick={async () => { if (!tenant?.tenantUrl || !tenantId) return; const firstUser = users.find((u) => u.email); if (!firstUser?.email) { setToast({ message: "Create an admin account first.", error: true }); return; } setOpeningTenant(true); try { const { token } = await platformApi.createTenantLoginToken(tenantId, firstUser.email); const base = tenant.tenantUrl.replace(/\/$/, ""); window.open(`${base}/auth/platform-callback?token=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer"); setToast({ message: "Opening tenant app..." }); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed to open tenant", error: true }); } finally { setOpeningTenant(false); } }} disabled={openingTenant || !tenant?.tenantUrl || users.length === 0} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:pointer-events-none">
                {openingTenant ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                Open tenant {users[0]?.email ? `as ${users[0].email.split("@")[0]}` : ""}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Tenant Details ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-sky-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-sky-500" /><h2 className="text-sm font-semibold text-sky-900 flex items-center gap-1.5"><Building2 className="h-4 w-4" /> Tenant Details</h2>
          </div>
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company name</label><input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Billing address</label><input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow" /></div>
            </div>
            <div className="mt-4"><button onClick={handleSaveTenantDetails} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium text-sm shadow-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save details</button></div>
          </div>
        </div>

        {/* ─── Subscription ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-orange-500" /><h2 className="text-sm font-semibold text-orange-900 flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Subscription</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="subscriptionMode" checked={subscriptionMode === "plan"} onChange={() => setSubscriptionMode("plan")} className="text-orange-600" /><span className="text-sm font-medium text-gray-800">Select Plan</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="subscriptionMode" checked={subscriptionMode === "custom"} onChange={() => { setSubscriptionMode("custom"); setPlanKey(""); }} className="text-orange-600" /><span className="text-sm font-medium text-gray-800">Custom Billing</span></label>
            </div>
            {subscriptionMode === "plan" ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Plan</label><select value={planKey} onChange={(e) => setPlanKey(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="">Select a plan</option>{plans.map((p) => <option key={p.planKey} value={p.planKey}>{p.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start date</label><input type="date" value={subscriptionStartDate} onChange={(e) => setSubscriptionStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expire date</label><input type="date" value={subscriptionExpireDate} onChange={(e) => setSubscriptionExpireDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing email</label><input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount</label><div className="relative"><input type="number" min={0} step={0.01} value={billingAmount} onChange={(e) => setBillingAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{sym}</span></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Billing cycle</label><select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as "monthly" | "yearly")} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"><option value="GBP">GBP ({"\u00A3"})</option><option value="USD">USD ($)</option><option value="EUR">EUR ({"\u20AC"})</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start date</label><input type="date" value={subscriptionStartDate} onChange={(e) => setSubscriptionStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Expire date</label><input type="date" value={subscriptionExpireDate} onChange={(e) => setSubscriptionExpireDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
              </div>
            )}
            <div><button onClick={subscriptionMode === "plan" ? handleSaveSubscription : handleSaveCustomBilling} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium text-sm shadow-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {subscriptionMode === "plan" ? "Save subscription" : "Save custom billing"}</button></div>
          </div>
        </div>

        {/* ─── Feature Overrides ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-white">
            <div className="flex items-center gap-2"><div className="w-1.5 h-5 rounded-full bg-indigo-500" /><h2 className="text-sm font-semibold text-indigo-900 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Feature Overrides</h2></div>
          </div>
          <div className="p-5 space-y-4">
            {/* Sales / Invoice — mutually exclusive selector */}
            <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/40 ring-1 ring-indigo-200/50">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">Sales / Invoice mode</p>
                  <p className="text-xs text-gray-500 mt-0.5">Only one can be enabled at a time. Effective: <span className="font-medium text-gray-700">{effectiveFeatures.sales ? "Sales" : effectiveFeatures.invoices ? "Invoice" : "None"}</span></p>
                </div>
                <select value={salesInvoiceMode} onChange={(e) => setSalesInvoiceMode(e.target.value as "none" | "sales" | "invoices")} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shrink-0">
                  <option value="none">None (both off)</option>
                  <option value="sales">Sales</option>
                  <option value="invoices">Invoice</option>
                </select>
              </div>
            </div>

            {features.filter((f) => !SALES_INVOICE_KEYS.has(f.key)).length === 0 ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">No other features in catalog.</p> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {features.filter((f) => !SALES_INVOICE_KEYS.has(f.key)).map((f) => {
                  const isOverridden = overrides.features[f.key] !== undefined;
                  return (
                    <div key={f.key} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isOverridden ? "border-indigo-300 bg-indigo-50/40 ring-1 ring-indigo-200/50" : "border-gray-200 bg-gray-50/50"}`}>
                      <div className="min-w-0"><p className="text-sm font-medium text-gray-900">{f.name}</p><p className="text-xs text-gray-400">Effective: <span className={effectiveFeatures[f.key] ? "text-green-600" : "text-gray-500"}>{effectiveFeatures[f.key] ? "On" : "Off"}</span></p></div>
                      <select value={overrides.features[f.key] === undefined ? "" : overrides.features[f.key] ? "true" : "false"} onChange={(e) => { const v = e.target.value; setFeatureOverride(f.key, v === "" ? undefined : v === "true"); }} className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shrink-0">
                        <option value="">Plan default</option><option value="true">On</option><option value="false">Off</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4"><button onClick={handleSaveSubscription} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium text-sm shadow-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save overrides</button></div>
          </div>
        </div>

        {/* ─── Limit Overrides ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-amber-500" /><h2 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5"><Gauge className="h-4 w-4" /> Limit Overrides</h2>
          </div>
          <div className="p-5">
            {limits.length === 0 ? <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">No limits in catalog.</p> : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {limits.map((l) => {
                  const hasOverride = overrides.limits[l.key] != null;
                  return (
                    <div key={l.key} className={`p-3 rounded-lg border transition-all ${hasOverride ? "border-amber-300 bg-amber-50/40 ring-1 ring-amber-200/50" : "border-gray-200 bg-gray-50/50"}`}>
                      <div className="flex items-center justify-between mb-1.5"><p className="text-sm font-medium text-gray-900">{l.name}</p><input type="number" min={0} placeholder="Default" value={overrides.limits[l.key] ?? ""} onChange={(e) => setLimitOverride(l.key, e.target.value === "" ? null : parseInt(e.target.value, 10))} className="border border-gray-300 rounded-lg px-2 py-1 w-24 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
                      <p className="text-xs text-gray-400">Effective: {effectiveLimits[l.key] ?? "Unlimited"} · Used: {usage[l.key] ?? 0}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4"><button onClick={handleSaveSubscription} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 font-medium text-sm shadow-sm">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save overrides</button></div>
          </div>
        </div>

        {/* ─── Tenant Accounts ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50/80 to-white">
            <div className="flex items-center gap-2"><div className="w-1.5 h-5 rounded-full bg-violet-500" /><h2 className="text-sm font-semibold text-violet-900 flex items-center gap-1.5"><Users className="h-4 w-4" /> Tenant Accounts</h2></div>
            <button onClick={() => setCreateUserOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"><Plus className="h-3.5 w-3.5" /> Create admin</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100"><tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last login</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-sm text-gray-900">{u.name}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-600">{u.email}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-600">{(u.roles && (u.roles as { name: string }[]).length) ? (u.roles as { name: string }[]).map((r) => r.name).join(", ") : (u.role ? String(u.role).charAt(0).toUpperCase() + String(u.role).slice(1) : "—")}</td>
                    <td className="py-2.5 px-4">{u.isActive ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span> : <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Disabled</span>}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-500">{u.lastLogin ? formatDateTimeLondon(u.lastLogin) : "—"}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button type="button" onClick={(e) => { rowMenuTriggerRef.current = e.currentTarget; setUserMenuOpenId(userMenuOpenId === u._id ? null : u._id); }} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"><MoreHorizontal className="h-4 w-4 text-gray-500" /></button>
                      <DropdownMenu open={userMenuOpenId === u._id} onClose={() => setUserMenuOpenId(null)} triggerRef={rowMenuTriggerRef} align="right" className="w-48">
                        {tenant?.tenantUrl && <button type="button" onClick={async () => { setUserMenuOpenId(null); if (!tenant?.tenantUrl || !u.email) return; setOpeningTenant(true); try { const { token } = await platformApi.createTenantLoginToken(tenantId, u.email); const base = tenant.tenantUrl.replace(/\/$/, ""); window.open(`${base}/auth/platform-callback?token=${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer"); setToast({ message: "Opening as " + u.email }); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed", error: true }); } finally { setOpeningTenant(false); } }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5" /> Open as this user</button>}
                        <button type="button" onClick={() => { setEditingUser(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> Edit</button>
                        <button type="button" onClick={() => { setUserMenuOpenId(null); const pwd = window.prompt("New password (min 10 chars):"); if (pwd) platformApi.resetTenantUserPassword(tenantId, u._id, pwd).then(() => { setToast({ message: "Password reset" }); loadUsers(); }).catch((e) => setToast({ message: e instanceof Error ? e.message : "Failed", error: true })); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"><Key className="h-3.5 w-3.5" /> Reset password</button>
                        <button type="button" onClick={() => { setDeleteUserConfirm(u); setUserMenuOpenId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && <p className="py-6 text-center text-gray-500 text-sm">No users. Create an admin account for this tenant.</p>}
        </div>

        {/* ─── Danger Zone ─── */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-red-100 bg-gradient-to-r from-red-50/80 to-white">
            <div className="w-1.5 h-5 rounded-full bg-red-500" /><h2 className="text-sm font-semibold text-red-900 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Danger Zone</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 mb-3">Permanently remove this tenant and its subscription from the platform.</p>
            <button type="button" onClick={() => setDeleteTenantConfirm(true)} className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium">Delete tenant</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {deleteTenantConfirm && tenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"><h2 className="text-lg font-semibold text-gray-800">Delete tenant</h2><p className="text-sm text-gray-600 mt-1">Remove <strong>{name || tenantId}</strong>? This cannot be undone.</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleteTenantConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button><button onClick={handleConfirmDeleteTenant} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button></div></div></div>
      )}
      {createUserOpen && tenantId && <CreateTenantUserModal tenantId={tenantId} onClose={() => setCreateUserOpen(false)} onCreated={() => { loadUsers(); setCreateUserOpen(false); setToast({ message: "Admin account created" }); }} setToast={setToast} />}
      {editingUser && tenantId && <EditTenantUserModal tenantId={tenantId} user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { loadUsers(); setEditingUser(null); setToast({ message: "User updated" }); }} setToast={setToast} />}
      {deleteUserConfirm && tenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"><h2 className="text-lg font-semibold text-gray-800">Delete user</h2><p className="text-sm text-gray-600 mt-1">Remove <strong>{deleteUserConfirm.email}</strong>?</p><div className="mt-6 flex justify-end gap-2"><button onClick={() => setDeleteUserConfirm(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-800 font-medium">Cancel</button><button onClick={handleConfirmDeleteUser} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button></div></div></div>
      )}
    </div>
  );
}

function CreateTenantUserModal({ tenantId, onClose, onCreated, setToast }: { tenantId: string; onClose: () => void; onCreated: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [assignAllRoles, setAssignAllRoles] = useState(true); const [saving, setSaving] = useState(false);
  async function submit() { const trimmedEmail = email.trim().toLowerCase(); if (!trimmedEmail) { setToast({ message: "Email is required", error: true }); return; } if (password.length < 10) { setToast({ message: "Password must be at least 10 characters", error: true }); return; } setSaving(true); try { await platformApi.createTenantUser(tenantId, { name: name.trim() || trimmedEmail.split("@")[0], email: trimmedEmail, password, assignAllRoles, isActive: true }); onCreated(); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed", error: true }); } finally { setSaving(false); } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 className="text-lg font-semibold text-gray-900">Create admin account</h2><p className="text-sm text-gray-500 mt-1">Create a user for this tenant with all roles.</p>
      <div className="mt-4 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Admin" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="admin@tenant.com" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-gray-400 font-normal">(min 10 chars)</span></label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={assignAllRoles} onChange={(e) => setAssignAllRoles(e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" /><span className="text-sm font-medium text-gray-700">Assign all roles (admin)</span></label>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Cancel</button><button onClick={submit} disabled={saving || !email.trim() || password.length < 10} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Creating..." : "Create"}</button></div>
    </div></div>
  );
}

type TenantRole = { _id: string; name: string; description?: string };

function EditTenantUserModal({ tenantId, user, onClose, onSaved, setToast }: { tenantId: string; user: TenantUser; onClose: () => void; onSaved: () => void; setToast: (t: { message: string; error?: boolean } | null) => void }) {
  const [name, setName] = useState(user.name); const [email, setEmail] = useState(user.email); const [isActive, setIsActive] = useState(user.isActive); const [newPassword, setNewPassword] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>(() => { const r = user.roles ?? []; return r.map((role: { _id?: string } | string) => (typeof role === "object" && role && "_id" in role ? (role._id ?? "") : String(role))).filter(Boolean); });
  const [assignAllRoles, setAssignAllRoles] = useState(false); const [roles, setRoles] = useState<TenantRole[]>([]); const [rolesLoading, setRolesLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { platformApi.listRoles(tenantId).then((list) => { setRoles(list); setRolesLoading(false); }).catch(() => setRolesLoading(false)); }, [tenantId]);
  useEffect(() => { setName(user.name); setEmail(user.email); setIsActive(user.isActive); const r = user.roles ?? []; setRoleIds(r.map((role: { _id?: string } | string) => (typeof role === "object" && role && "_id" in role ? (role._id ?? "") : String(role))).filter(Boolean)); }, [user]);
  useEffect(() => { if (roles.length > 0 && roleIds.length === roles.length) setAssignAllRoles(true); }, [roles.length, roleIds.length]);
  function toggleRole(id: string) { setRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])); setAssignAllRoles(false); }
  function toggleAssignAllRoles() { if (assignAllRoles) { setRoleIds([]); setAssignAllRoles(false); } else { setRoleIds(roles.map((r) => r._id)); setAssignAllRoles(true); } }
  async function submit() { const trimmedEmail = email.trim().toLowerCase(); if (!trimmedEmail) { setToast({ message: "Email is required", error: true }); return; } setSaving(true); try { const finalRoleIds = assignAllRoles ? roles.map((r) => r._id) : roleIds; await platformApi.updateTenantUser(tenantId, user._id, { name: name.trim(), email: trimmedEmail, isActive, roleIds: finalRoleIds }); if (newPassword.length >= 10) await platformApi.resetTenantUserPassword(tenantId, user._id, newPassword); onSaved(); } catch (e) { setToast({ message: e instanceof Error ? e.message : "Failed", error: true }); } finally { setSaving(false); } }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"><div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
      <h2 className="text-lg font-semibold text-gray-800">Edit user</h2><p className="text-sm text-gray-500 mt-1">Update name, email, roles, status, or password.</p>
      <div className="mt-4 space-y-4">
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" /></div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" /><span className="text-sm font-medium text-gray-700">Active (can sign in)</span></label>
        {!rolesLoading && roles.length > 0 && (
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Roles</label><label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={assignAllRoles} onChange={toggleAssignAllRoles} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" /><span className="text-sm text-gray-700">Assign all roles (admin)</span></label>
            <div className="grid grid-cols-2 gap-2">{roles.map((r) => <label key={r._id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={roleIds.includes(r._id)} onChange={() => toggleRole(r._id)} className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" /><span className="text-sm">{r.name}</span></label>)}</div>
          </div>
        )}
        <div><label className="block text-sm font-medium text-gray-700 mb-1">New password <span className="text-gray-400 font-normal">(leave blank to keep)</span></label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Min 10 characters" /></div>
      </div>
      <div className="mt-6 flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium">Cancel</button><button onClick={submit} disabled={saving || !email.trim()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button></div>
    </div></div>
  );
}
