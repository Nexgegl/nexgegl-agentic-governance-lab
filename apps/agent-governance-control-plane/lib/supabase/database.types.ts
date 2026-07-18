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
export type PermissionCellStatusRow = "allowed" | "requires_approval" | "blocked" | "forbidden";
export type PermissionColumnRow =
  | "read_internal_docs"
  | "read_customer_data"
  | "read_crm"
  | "update_crm"
  | "send_email"
  | "export_data"
  | "trigger_workflow"
  | "external_api_access";

export type DataSourceTypeRow = "structured" | "unstructured" | "document_repository" | "api_feed";
export type ModelProviderRow = "OpenAI" | "Anthropic" | "Microsoft" | "Google" | "Open-source" | "Internal";
export type DataResidencyRow = "in_country" | "regional" | "unknown";
export type VendorContractStatusRow = "active" | "under_review" | "expired";
export type AgentStatusRow = "active" | "suspended" | "under_review";
export type IncidentSeverityRow = "low" | "medium" | "high";
export type IncidentStatusRow = "open" | "investigating" | "resolved";
export type GovernanceLayerRow =
  | "ai_inventory"
  | "data_foundation"
  | "model_lifecycle"
  | "data_security_privacy"
  | "access_control"
  | "agent_governance"
  | "human_oversight"
  | "compliance_audit";

export type SkillSourceTypeRow = "INTERNAL" | "OFFICIAL_VENDOR" | "COMMUNITY" | "CUSTOM_ADAPTED";
export type SkillReviewStatusRow = "UNREVIEWED" | "UNDER_REVIEW" | "APPROVED_FOR_DEMO" | "REPAIR_REQUIRED" | "BLOCKED" | "RETIRED";
export type SkillActionTypeRow = "READ" | "ANALYSIS" | "GENERATION" | "WRITE";
export type SkillReversibilityRow = "REVERSIBLE" | "IRREVERSIBLE" | "NOT_APPLICABLE";
export type ToolTypeRow =
  | "WEB_SEARCH"
  | "DOCUMENT_RETRIEVAL"
  | "INTERNAL_DATA_LOOKUP"
  | "CALCULATOR"
  | "REPORT_GENERATOR"
  | "EXTERNAL_API"
  | "WRITE_ACTION";
export type ApprovalModeRow = "NONE" | "PRE_APPROVAL" | "PER_CALL_APPROVAL" | "HUMAN_CONFIRMATION" | "FORBIDDEN";
export type ReadWriteClassRow = "READ_ONLY" | "WRITE";

export interface SkillRiskProfileRow {
  writeCapability: boolean;
  externalSystemAccess: boolean;
  dataSensitivityHandled: DataSensitivityRow;
  requiresHumanApproval: boolean;
}

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
          owner_evidence: boolean;
          authority_evidence: boolean;
          eval_evidence: boolean;
          audit_evidence: boolean;
          policy_boundary_evidence: boolean;
          approval_evidence: boolean;
          permissions: Partial<Record<PermissionColumnRow, PermissionCellStatusRow>>;
          model_id: string | null;
          vendor_id: string | null;
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
          owner_evidence?: boolean;
          authority_evidence?: boolean;
          eval_evidence?: boolean;
          audit_evidence?: boolean;
          policy_boundary_evidence?: boolean;
          approval_evidence?: boolean;
          permissions?: Partial<Record<PermissionColumnRow, PermissionCellStatusRow>>;
          model_id?: string | null;
          vendor_id?: string | null;
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
          owner_evidence: boolean;
          authority_evidence: boolean;
          eval_evidence: boolean;
          audit_evidence: boolean;
          policy_boundary_evidence: boolean;
          approval_evidence: boolean;
          permissions: Partial<Record<PermissionColumnRow, PermissionCellStatusRow>>;
          model_id: string | null;
          vendor_id: string | null;
        }>;
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          category: string | null;
          data_access_level: DataSensitivityRow;
          contract_status: VendorContractStatusRow;
          risk_tier: RiskLevelRow;
          last_assessed: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendors"]["Row"]> &
          Pick<Database["public"]["Tables"]["vendors"]["Row"], "name" | "name_ar" | "data_access_level" | "contract_status" | "risk_tier">;
        Update: Partial<Database["public"]["Tables"]["vendors"]["Row"]>;
        Relationships: [];
      };
      data_sources: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          type: DataSourceTypeRow;
          sensitivity: DataSensitivityRow;
          owner: string | null;
          classification_status: EvidenceStatusRow;
          last_classified: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["data_sources"]["Row"]> &
          Pick<Database["public"]["Tables"]["data_sources"]["Row"], "name" | "name_ar" | "type" | "sensitivity" | "classification_status">;
        Update: Partial<Database["public"]["Tables"]["data_sources"]["Row"]>;
        Relationships: [];
      };
      models: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          provider: ModelProviderRow;
          version: string | null;
          vendor_id: string | null;
          data_residency: DataResidencyRow;
          evaluation_status: EvidenceStatusRow;
          last_evaluated: string | null;
          risk_tier: RiskLevelRow;
          approved_for_production: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["models"]["Row"]> &
          Pick<Database["public"]["Tables"]["models"]["Row"], "name" | "provider" | "data_residency" | "evaluation_status" | "risk_tier">;
        Update: Partial<Database["public"]["Tables"]["models"]["Row"]>;
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          use_case_id: string | null;
          agent_type: string | null;
          tool_access: ToolAccessLevelRow;
          status: AgentStatusRow;
          owner_team: string | null;
          last_permission_review: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["agents"]["Row"]> &
          Pick<Database["public"]["Tables"]["agents"]["Row"], "name" | "name_ar" | "tool_access" | "status">;
        Update: Partial<Database["public"]["Tables"]["agents"]["Row"]>;
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          organization_id: string;
          use_case_id: string | null;
          title: string;
          title_ar: string;
          severity: IncidentSeverityRow;
          status: IncidentStatusRow;
          reported_date: string | null;
          resolved_date: string | null;
          summary_ar: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["incidents"]["Row"]> &
          Pick<Database["public"]["Tables"]["incidents"]["Row"], "title" | "title_ar" | "severity" | "status">;
        Update: Partial<Database["public"]["Tables"]["incidents"]["Row"]>;
        Relationships: [];
      };
      compliance_mappings: {
        Row: {
          id: string;
          organization_id: string;
          framework_name: string;
          requirement: string | null;
          requirement_ar: string;
          mapped_control_ids: string[];
          status: EvidenceStatusRow;
          owner: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["compliance_mappings"]["Row"]> &
          Pick<Database["public"]["Tables"]["compliance_mappings"]["Row"], "framework_name" | "requirement_ar" | "status">;
        Update: Partial<Database["public"]["Tables"]["compliance_mappings"]["Row"]>;
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          timestamp: string;
          actor: string;
          action: string | null;
          action_ar: string;
          use_case_id: string | null;
          layer: GovernanceLayerRow;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_events"]["Row"]> &
          Pick<Database["public"]["Tables"]["audit_events"]["Row"], "actor" | "action_ar" | "layer">;
        Update: Partial<Database["public"]["Tables"]["audit_events"]["Row"]>;
        Relationships: [];
      };
      data_lineage: {
        Row: {
          id: string;
          organization_id: string;
          data_source_id: string;
          use_case_id: string | null;
          flow_description: string | null;
          flow_description_ar: string;
        };
        Insert: Partial<Database["public"]["Tables"]["data_lineage"]["Row"]> &
          Pick<Database["public"]["Tables"]["data_lineage"]["Row"], "data_source_id" | "flow_description_ar">;
        Update: Partial<Database["public"]["Tables"]["data_lineage"]["Row"]>;
        Relationships: [];
      };
      use_case_data_sources: {
        Row: {
          organization_id: string;
          use_case_id: string;
          data_source_id: string;
        };
        Insert: Database["public"]["Tables"]["use_case_data_sources"]["Row"];
        Update: Partial<Database["public"]["Tables"]["use_case_data_sources"]["Row"]>;
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          version: string;
          description: string | null;
          description_ar: string | null;
          source_type: SkillSourceTypeRow;
          source_reference: string | null;
          category: string | null;
          trigger_conditions: string[];
          required_tools: string[];
          allowed_data_classes: DataSensitivityRow[];
          prohibited_data_classes: DataSensitivityRow[];
          required_authority: boolean;
          action_type: SkillActionTypeRow;
          reversibility: SkillReversibilityRow;
          external_system_access: boolean;
          write_capability: boolean;
          audit_required: boolean;
          human_approval_required: boolean;
          risk_level: RiskLevelRow;
          review_status: SkillReviewStatusRow;
          approved_for_use: boolean;
          checksum: string | null;
          last_reviewed: string | null;
          reviewer: string | null;
          instructions: string[];
          risk_profile: SkillRiskProfileRow;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skills"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["skills"]["Row"],
            "id" | "name" | "name_ar" | "version" | "source_type" | "action_type" | "reversibility" | "risk_level" | "review_status"
          >;
        Update: Partial<Database["public"]["Tables"]["skills"]["Row"]>;
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          name_ar: string;
          description: string | null;
          description_ar: string | null;
          tool_type: ToolTypeRow;
          system: string | null;
          action_type: SkillActionTypeRow;
          read_write_class: ReadWriteClassRow;
          data_classes: DataSensitivityRow[];
          external_access: boolean;
          required_authority: boolean;
          approval_mode: ApprovalModeRow;
          reversible: boolean;
          audit_required: boolean;
          max_calls_per_run: number;
          enabled: boolean;
          demo_only: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tools"]["Row"]> &
          Pick<Database["public"]["Tables"]["tools"]["Row"], "id" | "name" | "name_ar" | "tool_type" | "action_type" | "read_write_class" | "approval_mode">;
        Update: Partial<Database["public"]["Tables"]["tools"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
