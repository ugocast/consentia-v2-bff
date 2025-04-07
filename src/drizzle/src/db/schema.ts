import { pgTable, uuid, text, timestamp, json, primaryKey, type PgTableWithColumns } from "drizzle-orm/pg-core";

// AuthUser (Referencia a Supabase Auth)
export const authUser = pgTable("auth_users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull()
});

// LegalPolicy (definido antes para evitar referencia circular)
export const legalPolicy = pgTable("legal_policy", {
  legal_policy_id: uuid("legal_policy_id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }),
  version: text("version").notNull(),
  description: text("description").notNull(),
  valid_from: timestamp("valid_from").notNull(),
  valid_until: timestamp("valid_until"),
  status: text("status", { enum: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"] }).default("DRAFT"),
  metadata: json("metadata")
}) as PgTableWithColumns<any>;

// Company
export const company = pgTable("company", {
  company_id: uuid("company_id").defaultRandom().primaryKey(),
  company_name: text("company_name").notNull(),
  contact_email: text("contact_email").notNull().unique(),
  phone: text("phone"),
  subscription_plan: text("subscription_plan", { enum: ["FREE", "STANDARD", "PREMIUM"] }),
  registered_at: timestamp("registered_at").defaultNow(),
  status: text("status", { enum: ["ACTIVE", "SUSPENDED", "CANCELED"] }).default("ACTIVE"),
  active_policy_id: uuid("active_policy_id").references(() => legalPolicy.legal_policy_id),
  metadata: json("metadata")
}) as PgTableWithColumns<any>;

// CompanyConfiguration
export const companyConfiguration = pgTable("company_configuration", {
  config_id: uuid("config_id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }),
  configuration: json("configuration").notNull()
});

// ExternalIntegration
export const externalIntegration = pgTable("external_integration", {
  integration_id: uuid("integration_id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }),
  system_name: text("system_name").notNull(),
  type: text("type", { enum: ["CRM", "ECOMMERCE", "MARKETING", "OTHER"] }),
  callback_url: text("callback_url"),
  api_key: text("api_key"),
  secret: text("secret"),
  configured_at: timestamp("configured_at").defaultNow(),
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "ERROR", "DELETED"] }).default("ACTIVE"),
  metadata: json("metadata")
});

// CompanyUser
export const companyUser = pgTable("company_user", {
  company_user_id: uuid("company_user_id").defaultRandom().primaryKey(),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }),
  auth_id: uuid("auth_id").references(() => authUser.id, { onDelete: "cascade" }),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["ADMINISTRATOR", "OPERATOR", "AUDITOR"] }),
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"] }).default("ACTIVE"),
  metadata: json("metadata")
});

// UserActiveCompany - Nueva tabla para almacenar la empresa activa de un usuario
export const userActiveCompany = pgTable("user_active_company", {
  active_company_id: uuid("active_company_id").defaultRandom().primaryKey(),
  user_id: uuid("user_id").references(() => authUser.id, { onDelete: "cascade" }).notNull(),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull()
});

// DataSubject
export const dataSubject = pgTable("data_subject", {
  data_subject_id: uuid("data_subject_id").defaultRandom().primaryKey(),
  auth_id: uuid("auth_id").references(() => authUser.id, { onDelete: "cascade" }),
  full_name: text("full_name").notNull(),
  phone: text("phone"),
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "DELETED"] }).default("ACTIVE"),
  metadata: json("metadata")
});

// Consent
export const consent = pgTable("consent", {
  consent_id: uuid("consent_id").defaultRandom().primaryKey(),
  data_subject_id: uuid("data_subject_id").references(() => dataSubject.data_subject_id, { onDelete: "cascade" }),
  company_id: uuid("company_id").references(() => company.company_id, { onDelete: "cascade" }),
  legal_policy_id: uuid("legal_policy_id").references(() => legalPolicy.legal_policy_id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["EMAIL", "SMS", "PORTAL", "API"] }),
  purpose: text("purpose").notNull(),
  status: text("status", { enum: ["ACCEPTED", "REJECTED", "REVOKED", "EXPIRED"] }).default("ACCEPTED"),
  consented_at: timestamp("consented_at").defaultNow(),
  expires_at: timestamp("expires_at"),
  pdf_url: text("pdf_url"),
  metadata: json("metadata")
});

// DataType
export const dataType = pgTable("data_type", {
  data_type_id: uuid("data_type_id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "DELETED"] }).default("ACTIVE")
});

// ConsentDataType
export const consentDataType = pgTable("consent_data_type", {
  consent_id: uuid("consent_id").references(() => consent.consent_id, { onDelete: "cascade" }),
  data_type_id: uuid("data_type_id").references(() => dataType.data_type_id, { onDelete: "cascade" }),
  status: text("status", { enum: ["ACTIVE", "INACTIVE", "DELETED"] }).default("ACTIVE")
}, (t) => ({
  pk: primaryKey({ columns: [t.consent_id, t.data_type_id] })
}));

// AuditLog (esta tabla no necesita soft-delete ya que es un registro histórico)
export const auditLog = pgTable("audit_log", {
  audit_id: uuid("audit_id").defaultRandom().primaryKey(),
  company_user_id: uuid("company_user_id").references(() => companyUser.company_user_id, { onDelete: "cascade" }),
  data_subject_id: uuid("data_subject_id").references(() => dataSubject.data_subject_id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  ip_address: text("ip_address").notNull(),
  action_at: timestamp("action_at").defaultNow(),
  details: json("details")
}); 