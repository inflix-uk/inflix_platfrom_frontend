const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}/api`;
const PLATFORM_TOKEN_KEY = "platformToken";

function getPlatformAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { "X-Platform-Auth": `Bearer ${token}` } : {}),
  };
}

export interface FeatureCatalogItem {
  _id: string;
  key: string;
  name: string;
  description?: string;
  category: string;
  defaultEnabled: boolean;
  isActive: boolean;
}

export interface LimitCatalogItem {
  _id: string;
  key: string;
  name: string;
  description?: string;
  unit: string;
  defaultValue: number | null;
  isActive: boolean;
}

export interface PlanCatalogItem {
  _id: string;
  planKey: string;
  name: string;
  description?: string;
  priceMetadata?: { monthly?: number; yearly?: number; currency?: string } | null;
  features: Record<string, boolean>;
  limits: Record<string, number | null>;
  isActive: boolean;
}

export interface TenantListItem {
  tenantId: string;
  tenantSubdomain?: string;
  tenantUrl?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  billingAddress: string;
  billingEmail: string;
  billingAmount: number | null;
  billingCycle: "monthly" | "yearly";
  currency: string;
  status: string;
  planKey: string | null;
  startDate: string | null;
  expireDate: string | null;
  overrides: { features: Record<string, boolean>; limits: Record<string, number | null> } | null;
}

export interface CreateTenantResult {
  tenantId: string;
  tenantSubdomain: string;
  tenantUrl: string;
  tenantDbName: string;
  status: string;
  planKey: string;
  createdFirstAdmin: boolean;
}

export interface TenantDetail {
  tenantId: string;
  tenantSubdomain?: string;
  tenantUrl?: string;
  tenantDbName?: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  billingAddress: string;
  billingEmail: string;
  billingAmount: number | null;
  billingCycle: "monthly" | "yearly";
  currency: string;
  status: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export interface TenantUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  roles?: { _id: string; name: string; description?: string }[];
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TenantSubscriptionDetail {
  tenantId: string;
  subscriptionType: 'plan' | 'custom';
  planKey: string | null;
  startDate: string | null;
  expireDate: string | null;
  overrides: { features: Record<string, boolean>; limits: Record<string, number | null> };
  effective: {
    enabledFeatures: Record<string, boolean>;
    limits: Record<string, number | null>;
  };
  usage: Record<string, number>;
}

export interface PlatformAdminAccount {
  _id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}

export const platformApi = {
  async getFeatureCatalog(activeOnly = true): Promise<FeatureCatalogItem[]> {
    const q = activeOnly ? "?active=true" : "";
    const res = await fetch(`${API_BASE}/platform/feature-catalog${q}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data ?? [];
  },
  async createFeature(body: Partial<FeatureCatalogItem>): Promise<FeatureCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/feature-catalog`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },
  async updateFeature(key: string, body: Partial<FeatureCatalogItem>): Promise<FeatureCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/feature-catalog/${encodeURIComponent(key)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },

  async getLimitCatalog(activeOnly = true): Promise<LimitCatalogItem[]> {
    const q = activeOnly ? "?active=true" : "";
    const res = await fetch(`${API_BASE}/platform/limit-catalog${q}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data ?? [];
  },
  async createLimit(body: Partial<LimitCatalogItem>): Promise<LimitCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/limit-catalog`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },
  async updateLimit(key: string, body: Partial<LimitCatalogItem>): Promise<LimitCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/limit-catalog/${encodeURIComponent(key)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },

  async getPlanCatalog(activeOnly = true): Promise<PlanCatalogItem[]> {
    const q = activeOnly ? "?active=true" : "";
    const res = await fetch(`${API_BASE}/platform/plan-catalog${q}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data ?? [];
  },
  async createPlan(body: Partial<PlanCatalogItem>): Promise<PlanCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/plan-catalog`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },
  async updatePlan(planKey: string, body: Partial<PlanCatalogItem>): Promise<PlanCatalogItem> {
    const res = await fetch(`${API_BASE}/platform/plan-catalog/${encodeURIComponent(planKey)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },
  async deletePlan(planKey: string): Promise<void> {
    const res = await fetch(`${API_BASE}/platform/plan-catalog/${encodeURIComponent(planKey)}`, { method: "DELETE", headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
  },

  async getTenants(): Promise<TenantListItem[]> {
    const res = await fetch(`${API_BASE}/platform/tenants`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data ?? [];
  },
  async getTenant(tenantId: string): Promise<TenantDetail> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}`, { headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load tenant");
    return json.data;
  },
  async updateTenant(tenantId: string, body: Partial<TenantDetail>): Promise<TenantDetail> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update tenant");
    return json.data;
  },
  async deleteTenant(tenantId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}`, { method: "DELETE", headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete tenant");
  },
  async checkSubdomain(subdomain: string): Promise<{ available: boolean }> {
    const res = await fetch(`${API_BASE}/platform/tenants-check-subdomain/${encodeURIComponent(subdomain)}`, { headers: getPlatformAuthHeaders() });
    const json = await res.json();
    return json;
  },
  async createTenant(body: {
    tenantSubdomain: string;
    tenantId?: string;
    tenantUrl?: string;
    name?: string;
    companyName?: string;
    contactEmail?: string;
    contactPhone?: string;
    email?: string;
    phone?: string;
    billingAddress?: string;
    billingEmail?: string;
    billingAmount?: number;
    billingCycle?: "monthly" | "yearly";
    currency?: string;
    planKey?: string;
    createFirstAdmin?: boolean;
    firstAdmin?: { name?: string; email: string; password: string };
  }): Promise<CreateTenantResult> {
    const res = await fetch(`${API_BASE}/platform/tenants`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create tenant");
    return json.data;
  },
  async listTenantUsers(tenantId: string): Promise<TenantUser[]> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/users`, { headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load users");
    return json.data ?? [];
  },
  async createTenantUser(tenantId: string, body: { name: string; email: string; password: string; roleIds?: string[]; assignAllRoles?: boolean; isActive?: boolean; phone?: string }) {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/users`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create user");
    return json;
  },
  async updateTenantUser(tenantId: string, userId: string, body: { name?: string; email?: string; roleIds?: string[]; isActive?: boolean; phone?: string }) {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update user");
    return json;
  },
  async resetTenantUserPassword(tenantId: string, userId: string, newPassword: string) {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}/reset-password`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify({ newPassword }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to reset password");
    return json;
  },
  async deleteTenantUser(tenantId: string, userId: string) {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(userId)}`, { method: "DELETE", headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete user");
    return json;
  },
  async listRoles(tenantId?: string): Promise<{ _id: string; name: string; description?: string }[]> {
    const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const res = await fetch(`${API_BASE}/platform/roles${q}`, { headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to load roles");
    return json.data ?? [];
  },
  /** One-time token for platform → tenant login (cross-domain). Redirect user to tenantUrl + /auth/platform-callback?token=... */
  async createTenantLoginToken(tenantId: string, email: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/tenant-login-token`, {
      method: "POST",
      headers: getPlatformAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create login link");
    return { token: json.token };
  },
  async getTenantSubscription(tenantId: string): Promise<TenantSubscriptionDetail> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/subscription`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },
  async updateTenantSubscription(tenantId: string, body: { subscriptionType?: 'plan' | 'custom'; planKey?: string; overrides?: { features?: Record<string, boolean>; limits?: Record<string, number | null> }; salesInvoiceMode?: 'none' | 'sales' | 'invoices'; startDate?: string | null; expireDate?: string | null }): Promise<TenantSubscriptionDetail> {
    const res = await fetch(`${API_BASE}/platform/tenants/${encodeURIComponent(tenantId)}/subscription`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(body) });
    if (!res.ok) throw new Error(await res.json().then((j) => j.message).catch(() => "Failed"));
    const json = await res.json();
    return json.data;
  },

  async listAdminAccounts(): Promise<PlatformAdminAccount[]> {
    const res = await fetch(`${API_BASE}/platform/admin-accounts`, { headers: getPlatformAuthHeaders() });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json && json.message) || "Failed to load admin accounts");
    const raw = json.data ?? json;
    return Array.isArray(raw) ? raw : [];
  },
  async createAdminAccount(payload: { email: string; password: string; role?: string }) {
    const res = await fetch(`${API_BASE}/platform/admin-accounts`, { method: "POST", headers: getPlatformAuthHeaders(), body: JSON.stringify({ email: payload.email, password: payload.password, role: payload.role ?? "platform_admin" }) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to create");
    return json;
  },
  async updateAdminAccount(id: string, payload: { email?: string; isActive?: boolean; newPassword?: string }) {
    const res = await fetch(`${API_BASE}/platform/admin-accounts/${encodeURIComponent(id)}`, { method: "PUT", headers: getPlatformAuthHeaders(), body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to update");
    return json;
  },
  async deleteAdminAccount(id: string) {
    const res = await fetch(`${API_BASE}/platform/admin-accounts/${encodeURIComponent(id)}`, { method: "DELETE", headers: getPlatformAuthHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Failed to delete");
    return json;
  },

  // ─── Health Checker ───
  async getHealthCheckerTenants(): Promise<{ tenantId: string; name: string; companyName: string; status: string }[]> {
    const res = await fetch(`${API_BASE}/platform/health-checker/tenants`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load tenants");
    const json = await res.json();
    return json.data ?? [];
  },
  async getHealthCheckerSummary(tenantId: string, from?: string, to?: string): Promise<HealthCheckerSummary> {
    const params = new URLSearchParams({ tenantId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`${API_BASE}/platform/health-checker/summary?${params}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load summary");
    const json = await res.json();
    return json.data;
  },
  async getHealthCheckerEndpoints(tenantId: string, from?: string, to?: string): Promise<HealthCheckerEndpoint[]> {
    const params = new URLSearchParams({ tenantId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`${API_BASE}/platform/health-checker/endpoints?${params}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load endpoints");
    const json = await res.json();
    return json.data ?? [];
  },
  async getHealthCheckerSlow(tenantId: string, from?: string, to?: string, limit = 20): Promise<HealthCheckerSlowRequest[]> {
    const params = new URLSearchParams({ tenantId, limit: String(limit) });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`${API_BASE}/platform/health-checker/slow?${params}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load slow requests");
    const json = await res.json();
    return json.data ?? [];
  },
  async getHealthCheckerUsers(tenantId: string, from?: string, to?: string): Promise<HealthCheckerUser[]> {
    const params = new URLSearchParams({ tenantId });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`${API_BASE}/platform/health-checker/users?${params}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load user stats");
    const json = await res.json();
    return json.data ?? [];
  },
  async getHealthCheckerRecent(tenantId: string, limit = 100, level?: string): Promise<HealthCheckerRecentRequest[]> {
    const params = new URLSearchParams({ tenantId, limit: String(limit) });
    if (level) params.set("level", level);
    const res = await fetch(`${API_BASE}/platform/health-checker/recent?${params}`, { headers: getPlatformAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load recent requests");
    const json = await res.json();
    return json.data ?? [];
  },
};

// ─── Health Checker Types ───
export interface HealthCheckerSummary {
  totalRequests: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  errorCount: number;
  serverErrorCount: number;
  errorRate: number;
  uniqueUsers: number;
  uniqueEndpoints: number;
  firstRequest: string | null;
  lastRequest: string | null;
}

export interface HealthCheckerEndpoint {
  method: string;
  url: string;
  hits: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  errorRate: number;
  lastHit: string;
  uniqueUsers: number;
}

export interface HealthCheckerSlowRequest {
  _id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  user: string;
  timestamp: string;
}

export interface HealthCheckerUser {
  user: string;
  totalRequests: number;
  avgDuration: number;
  errorCount: number;
  errorRate: number;
  lastActive: string;
  endpointCount: number;
}

export interface HealthCheckerRecentRequest {
  _id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  tenant: string;
  user: string;
  ip: string;
  level: string;
  error: string;
  userAgent: string;
  timestamp: string;
}
