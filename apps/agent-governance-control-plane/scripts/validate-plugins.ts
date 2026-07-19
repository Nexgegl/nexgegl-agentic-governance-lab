import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

interface Issue {
  check: string;
  message: string;
}

const issues: Issue[] = [];

function fail(check: string, message: string) {
  issues.push({ check, message });
}

function read(relPath: string): string | null {
  const full = path.join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function listFiles(dir: string, exts: string[]): string[] {
  const full = path.join(ROOT, dir);
  if (!existsSync(full)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(full, { withFileTypes: true })) {
    const relPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(relPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(relPath);
    }
  }
  return out;
}

/**
 * This script is static/structural validation, matching the existing
 * validate:runtime / validate:supabase convention in this repo (no test
 * framework dependency is introduced). It is NOT a substitute for the live
 * database testing performed once, interactively, during this change's
 * development (spinning up a real local Postgres, running every migration
 * and the seed script end-to-end, and exercising RLS/idempotency/
 * immutability with real signed-in sessions) — see the final report for
 * what that live pass actually confirmed. This script re-checks the same
 * invariants structurally so they can be re-verified on every run without
 * needing a live database.
 */

const migrationFiles = listFiles("supabase/migrations", [".sql"]);
const allMigrationSql = migrationFiles.map((f) => read(f) ?? "").join("\n");

const contextComposerSource = read("lib/plugins/context-composer.ts") ?? "";
const executionBoundarySource = read("lib/plugins/execution-boundary.ts") ?? "";
const errorsSource = read("lib/plugins/errors.ts") ?? "";
const intakeSkillSource = read("lib/plugins/skills/ai-inventory-intake.ts") ?? "";
const promotionComposerSource = read("lib/plugins/promotion-request-composer.ts") ?? "";
const coldStartSource = read("lib/plugins/cold-start.ts") ?? "";

// 1. Tenant isolation ---------------------------------------------------------

const TENANT_TABLES = [
  "plugin_installations",
  "organization_profiles",
  "domain_profiles",
  "connector_definitions",
  "plugin_connector_permissions",
  "skill_versions",
  "plugin_skill_permissions",
  "plugin_run_contexts",
  "plugin_runs",
  "plugin_evidence_outputs",
  "plugin_audit_events",
  "promotion_requests",
];
for (const table of TENANT_TABLES) {
  if (!new RegExp(`alter table public\\.${table} enable row level security`, "i").test(allMigrationSql)) {
    fail("tenant-isolation", `RLS is not enabled for ${table}.`);
  }
  if (!new RegExp(`${table}[\\s\\S]{0,400}?current_user_organization_id\\(\\)`, "i").test(allMigrationSql)) {
    fail("tenant-isolation", `${table} has no policy scoped through current_user_organization_id().`);
  }
}

// 2. Plugin installation authorization ----------------------------------------

if (!/plugin_installations_insert_own_org/.test(allMigrationSql) || !/plugin_installations_update_own_org/.test(allMigrationSql)) {
  fail("installation-authorization", "plugin_installations is missing an org-scoped insert/update policy.");
}
if (!/plugin_installations_force_org_id/.test(allMigrationSql)) {
  fail("installation-authorization", "plugin_installations has no trigger forcing organization_id server-side.");
}

// 3. Disabled plugin rejection -------------------------------------------------

if (!/rejectPluginDisabled/.test(contextComposerSource) || !/installation\.state !== "installed"/.test(contextComposerSource)) {
  fail("disabled-plugin-rejection", "context-composer.ts does not reject non-installed plugin installations.");
}

// 4. Unapproved / not-implemented skill rejection ------------------------------

if (!/executionStatus !== "implemented"/.test(executionBoundarySource)) {
  fail("unapproved-skill-rejection", "execution-boundary.ts does not reject skills whose executionStatus is not implemented.");
}
if (!/rejectSkillDisabledForInstallation/.test(contextComposerSource)) {
  fail("unapproved-skill-rejection", "context-composer.ts does not check plugin_skill_permissions before allowing a skill to run.");
}

// 5. Undeclared connector rejection -------------------------------------------

if (!/allowedConnectorIds\.includes\(connectorId\)/.test(executionBoundarySource)) {
  fail("undeclared-connector-rejection", "execution-boundary.ts does not verify each skill-declared connector is permitted before running.");
}

// 6. Missing organization profile ---------------------------------------------

if (!/rejectMissingOrganizationContext/.test(contextComposerSource)) {
  fail("missing-organization-profile", "context-composer.ts does not reject when no organization profile is resolved.");
}

// 7. Incomplete authority / profile information --------------------------------

if (!/missingRequiredProfileFieldsForSkill/.test(intakeSkillSource)) {
  fail("incomplete-authority-profile", "ai-inventory-intake.ts does not fail closed on missing required profile fields.");
}

// 8. Context composition -------------------------------------------------------

if (!/export async function composeContext/.test(contextComposerSource)) {
  fail("context-composition", "composeContext is not exported from context-composer.ts.");
}

// 9. Context snapshot immutability ---------------------------------------------

if (!/plugin_run_contexts_immutable/.test(allMigrationSql) || !/rows are immutable once created/.test(allMigrationSql)) {
  fail("context-snapshot-immutability", "plugin_run_contexts has no immutability guard trigger.");
}

// 10. Audit event creation ------------------------------------------------------

for (const [label, source] of [
  ["context-composer", contextComposerSource],
  ["execution-boundary", executionBoundarySource],
  ["cold-start", coldStartSource],
  ["promotion-request-composer", promotionComposerSource],
] as const) {
  if (!/createAuditEvent/.test(source)) {
    fail("audit-event-creation", `${label}.ts does not create an audit event.`);
  }
}

// 11. Cross-tenant plugin access ------------------------------------------------

if (!/plugin_installations_select_own_org/.test(allMigrationSql) || !/skills_select_own_org/.test(allMigrationSql)) {
  fail("cross-tenant-access", "plugin_installations or skills is missing an org-scoped select policy.");
}

// 12. Client-authored system identifier rejection -------------------------------

if (!/force_organization_id_from_caller/.test(allMigrationSql)) {
  fail("client-authored-identifiers", "No trigger forces organization_id server-side for the plugin foundation's write tables.");
}
if (!/prevent_organization_id_change|organization_id cannot be changed/.test(allMigrationSql)) {
  fail("client-authored-identifiers", "No trigger blocks changing organization_id after insert.");
}

// 13/14. Formal decision / KFSA decision code field rejection -------------------

const PROHIBITED_FIELD_NAMES = ["official_decision", "official_verdict", "kfsa_verdict", "kfsa_decision_id", "kfsa_decision_code"];
for (const field of PROHIBITED_FIELD_NAMES) {
  if (!executionBoundarySource.includes(field) && !intakeSkillSource.includes(field)) {
    fail("formal-decision-field-rejection", `Prohibited field "${field}" is not checked anywhere in the execution boundary.`);
  }
}
for (const table of ["use_cases", "plugin_runs", "promotion_requests", "plugin_definitions"]) {
  const tableBlock = new RegExp(`create table[\\s\\S]{0,50}public\\.${table}[\\s\\S]*?\\);`, "i").exec(allMigrationSql)?.[0] ?? "";
  for (const field of PROHIBITED_FIELD_NAMES) {
    if (tableBlock.toLowerCase().includes(field.replace(/_/g, ""))) {
      fail("formal-decision-field-rejection", `${table} appears to have a column resembling "${field}".`);
    }
  }
}

// 15. ReviewOutcome vs KFSA vocabulary separation -------------------------------

if (!/review_outcome text check \(review_outcome in \('PASS', 'FIX', 'FAIL', 'ESCALATE'\)\)/.test(allMigrationSql)) {
  fail("review-outcome-separation", "promotion_requests.review_outcome is not constrained to exactly PASS/FIX/FAIL/ESCALATE.");
}
if (/KILL['"]?\s*,?\s*['"]?SCALE|SCALE['"]?\s*,?\s*['"]?ALERT/.test(promotionComposerSource)) {
  fail("review-outcome-separation", "promotion-request-composer.ts appears to reference KFSA decision vocabulary directly.");
}
if (/review_outcome\s*[:=]\s*['"](KILL|SCALE|ALERT)['"]/.test(promotionComposerSource + executionBoundarySource)) {
  fail("review-outcome-separation", "A ReviewOutcome value appears to be set to a KFSA decision vocabulary word.");
}

// 16. Duplicate correlation_id idempotency --------------------------------------

if (!/unique \(organization_id, correlation_id\)/.test(allMigrationSql)) {
  fail("correlation-id-idempotency", "plugin_runs has no unique(organization_id, correlation_id) constraint.");
}
if (!/getRunByCorrelationId/.test(executionBoundarySource)) {
  fail("correlation-id-idempotency", "execution-boundary.ts does not check for an existing run by correlation_id before creating a new one.");
}

// 17. No browser exposure of connector or KFSA secrets --------------------------

for (const relPath of [...listFiles("app", [".ts", ".tsx"]), ...listFiles("components", [".ts", ".tsx"]), ...listFiles("lib/plugins", [".ts"])]) {
  const content = read(relPath);
  if (content && content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    fail("no-secret-exposure", `${relPath} references SUPABASE_SERVICE_ROLE_KEY but must never read it.`);
  }
}
if (/credential_value|credential_secret|api_key\s+text/.test(allMigrationSql)) {
  fail("no-secret-exposure", "connector_definitions appears to have a column for storing a raw credential value.");
}

// 18. No direct UI-origin formal decision creation ------------------------------

for (const relPath of listFiles("app/(app)/plugins", [".tsx"])) {
  const content = read(relPath) ?? "";
  for (const field of PROHIBITED_FIELD_NAMES) {
    if (content.includes(field)) {
      fail("no-ui-decision-creation", `${relPath} references prohibited field "${field}".`);
    }
  }
  if (/select[^>]*>\s*<option[^>]*>\s*(KILL|SCALE|ALERT)/i.test(content)) {
    fail("no-ui-decision-creation", `${relPath} appears to offer direct selection of a KFSA decision value.`);
  }
}

// 19. Promotion Request remains distinct from Decision --------------------------

const promotionRequestsBlock = new RegExp(`create table[\\s\\S]*?public\\.promotion_requests[\\s\\S]*?\\);`, "i").exec(allMigrationSql)?.[0] ?? "";
if (/decision|verdict/i.test(promotionRequestsBlock.replace(/review_outcome/gi, ""))) {
  fail("promotion-request-distinct", "promotion_requests appears to have a decision/verdict-shaped column.");
}

// 20. production_approval_status remains false ----------------------------------

if (!/production_approval_status boolean not null default false/.test(allMigrationSql)) {
  fail("production-approval-false", "use_cases.production_approval_status is not declared boolean not null default false.");
}
if (!/plugin_definitions[\s\S]{0,400}production_approval_status boolean not null default false/.test(allMigrationSql)) {
  fail("production-approval-false", "plugin_definitions.production_approval_status is not declared boolean not null default false.");
}
if (!/approved_for_production boolean not null default false/.test(allMigrationSql)) {
  fail("production-approval-false", "models.approved_for_production is not declared boolean not null default false.");
}
for (const relPath of listFiles("lib/plugins", [".ts"]).concat(listFiles("app/api/plugins", [".ts"]))) {
  const content = read(relPath) ?? "";
  if (/production_approval_status\s*[:=]\s*true|approved_for_production\s*[:=]\s*true/.test(content)) {
    fail("production-approval-false", `${relPath} appears to set a production-approval field to true.`);
  }
}

// ALERT preservation check (constitutional, not in the numbered list, but explicitly required) --

if (!/ALERT/.test(allMigrationSql) && !existsSync(path.join(ROOT, "..", "..", "claude-operating-system", "00-master-standards", "KFSA_VOCABULARY_MAP_v1_1.md"))) {
  fail("alert-preserved", "ALERT does not appear anywhere and the KFSA vocabulary map could not be found to confirm it separately.");
}

// ----------------------------------------------------------------------------

console.log(`Vertical Plugin Foundation v1 validation: ${issues.length === 0 ? "OK" : "FAILED"}`);
console.log(`Issues: ${issues.length}`);
for (const issue of issues) {
  console.log(`  [${issue.check}] ${issue.message}`);
}

if (issues.length > 0) {
  process.exit(1);
}
