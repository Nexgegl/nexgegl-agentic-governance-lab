/**
 * Hand-authored to match supabase/migrations/*.sql. Regenerate with
 * `supabase gen types typescript --linked` once this branch is linked to a
 * live project, and replace this file with the generated output.
 */

export type GateStatusRow =
  | "BLOCKED"
  | "REPAIR_REQUIRED"
  | "GOVERNANCE_REVIEW_REQUIRED"
  | "ESCALATE_REQUIRED"
  | "READY_FOR_AUTHORITY_REVIEW";

export type ReviewOutcomeRow = "PASS" | "FIX" | "FAIL" | "ESCALATE";
export type RiskLevelRow = "low" | "medium" | "high";
export type DataSensitivityRow = "low" | "medium" | "high";
export type ToolAccessLevelRow = "none" | "read_only" | "write" | "external_system";
export type EvidenceStatusRow = "complete" | "partial" | "missing";
export type AuthorityStatusRow = "confirmed" | "missing" | "escalation_required";
export type AuditTrailStatusRow = "present" | "partial" | "missing";
export type LifecycleStageRow = "proposed" | "pilot" | "governed_runtime" | "retired";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          slug: string;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string | null;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          full_name?: string | null;
          role?: string;
          created_at?: string;
        };
        Update: Partial<{
          full_name: string | null;
        }>;
        Relationships: [];
      };
      use_cases: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          department: string | null;
          owner_name: string | null;
          authority: string | null;
          ai_type: string | null;
          business_purpose: string | null;
          business_purpose_ar: string | null;
          risk_level: RiskLevelRow;
          data_sensitivity: DataSensitivityRow;
          tool_access: ToolAccessLevelRow;
          governance_status: GateStatusRow;
          eval_score: number | null;
          eval_outcome: ReviewOutcomeRow;
          readiness_score: number | null;
          evidence_status: EvidenceStatusRow;
          authority_status: AuthorityStatusRow;
          audit_trail_status: AuditTrailStatusRow;
          lifecycle_stage: LifecycleStageRow;
          production_approval_status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          /** Ignored server-side: the insert trigger always overwrites this from the caller's profile. */
          organization_id?: string;
          name: string;
          name_ar: string;
          department?: string | null;
          owner_name?: string | null;
          authority?: string | null;
          ai_type?: string | null;
          business_purpose?: string | null;
          business_purpose_ar?: string | null;
          risk_level: RiskLevelRow;
          data_sensitivity: DataSensitivityRow;
          tool_access: ToolAccessLevelRow;
          governance_status: GateStatusRow;
          eval_score?: number | null;
          eval_outcome: ReviewOutcomeRow;
          readiness_score?: number | null;
          evidence_status: EvidenceStatusRow;
          authority_status: AuthorityStatusRow;
          audit_trail_status: AuditTrailStatusRow;
          lifecycle_stage: LifecycleStageRow;
        };
        Update: Partial<{
          name: string;
          name_ar: string;
          department: string | null;
          owner_name: string | null;
          authority: string | null;
          ai_type: string | null;
          business_purpose: string | null;
          business_purpose_ar: string | null;
          risk_level: RiskLevelRow;
          data_sensitivity: DataSensitivityRow;
          tool_access: ToolAccessLevelRow;
          governance_status: GateStatusRow;
          eval_score: number | null;
          eval_outcome: ReviewOutcomeRow;
          readiness_score: number | null;
          evidence_status: EvidenceStatusRow;
          authority_status: AuthorityStatusRow;
          audit_trail_status: AuditTrailStatusRow;
          lifecycle_stage: LifecycleStageRow;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
