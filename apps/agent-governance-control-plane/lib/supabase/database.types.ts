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
export type SkillExecutionStatusRow = "implemented" | "not_implemented";

// --- Plugin foundation ------------------------------------------------------

export type PluginStatusRow = "experimental" | "approved" | "deprecated" | "blocked";
export type PluginInstallationStateRow = "proposed" | "approved" | "installed" | "disabled" | "deprecated" | "blocked";
export type GovernanceModelRow = "centralized" | "federated" | "hybrid";
export type ConnectorStatusRow = "enabled" | "disabled" | "not_configured";
export type PluginRunStatusRow = "submitted" | "completed" | "rejected";

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
          plugin_id: string | null;
          execution_status: SkillExecutionStatusRow;
          required_profile_fields: string[];
          permitted_connectors: string[];
          escalation_conditions: string[];
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
      plugin_definitions: {
        Row: {
          plugin_id: string;
          name: { en: string; ar: string };
          domain: string;
          description: { en: string; ar: string } | null;
          status: PluginStatusRow;
          production_approval_status: boolean;
          owner: string | null;
          required_platform_version: string | null;
          constitutional_reference: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_definitions"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_definitions"]["Row"], "plugin_id" | "name" | "domain">;
        Update: Partial<Database["public"]["Tables"]["plugin_definitions"]["Row"]>;
        Relationships: [];
      };
      plugin_versions: {
        Row: {
          id: string;
          plugin_id: string;
          version: string;
          manifest: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_versions"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_versions"]["Row"], "plugin_id" | "version" | "manifest">;
        Update: Partial<Database["public"]["Tables"]["plugin_versions"]["Row"]>;
        Relationships: [];
      };
      plugin_installations: {
        Row: {
          id: string;
          organization_id: string;
          plugin_id: string;
          plugin_version_id: string;
          state: PluginInstallationStateRow;
          installed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_installations"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_installations"]["Row"], "plugin_id" | "plugin_version_id">;
        Update: Partial<Database["public"]["Tables"]["plugin_installations"]["Row"]>;
        Relationships: [];
      };
      organization_profiles: {
        Row: {
          id: string;
          organization_id: string;
          sector: string | null;
          jurisdictions: string[];
          business_units: string[];
          governance_model: GovernanceModelRow | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["organization_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["organization_profiles"]["Row"]>;
        Relationships: [];
      };
      domain_profiles: {
        Row: {
          id: string;
          organization_id: string;
          domain: string;
          profile: Record<string, unknown>;
          completeness_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["domain_profiles"]["Row"]> &
          Pick<Database["public"]["Tables"]["domain_profiles"]["Row"], "domain">;
        Update: Partial<Database["public"]["Tables"]["domain_profiles"]["Row"]>;
        Relationships: [];
      };
      connector_definitions: {
        Row: {
          id: string;
          organization_id: string;
          connector_id: string;
          connector_type: string;
          status: ConnectorStatusRow;
          allowed_operations: string[];
          denied_operations: string[];
          data_classifications: string[];
          credential_scope: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["connector_definitions"]["Row"]> &
          Pick<Database["public"]["Tables"]["connector_definitions"]["Row"], "connector_id" | "connector_type">;
        Update: Partial<Database["public"]["Tables"]["connector_definitions"]["Row"]>;
        Relationships: [];
      };
      plugin_connector_permissions: {
        Row: {
          id: string;
          organization_id: string;
          plugin_id: string;
          connector_id: string;
          allowed: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_connector_permissions"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_connector_permissions"]["Row"], "plugin_id" | "connector_id">;
        Update: Partial<Database["public"]["Tables"]["plugin_connector_permissions"]["Row"]>;
        Relationships: [];
      };
      /**
       * Global, plugin-owned skill catalog -- not tenant data (no
       * organization_id). Distinct from `skills` (legacy, organization-
       * scoped, used by the pre-existing Governed Research Runtime) and
       * from `skill_versions` below (also organization-scoped, unused by
       * the plugin architecture). See
       * supabase/migrations/20260720100004_create_global_skill_catalog.sql.
       */
      skill_definitions: {
        Row: {
          id: string;
          plugin_id: string;
          name: string;
          name_ar: string;
          version: string;
          description: string | null;
          description_ar: string | null;
          category: string | null;
          execution_status: SkillExecutionStatusRow;
          required_profile_fields: string[];
          permitted_connectors: string[];
          escalation_conditions: string[];
          risk_level: RiskLevelRow | null;
          human_approval_required: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_definitions"]["Row"]> &
          Pick<Database["public"]["Tables"]["skill_definitions"]["Row"], "id" | "plugin_id" | "name" | "name_ar" | "version">;
        Update: Partial<Database["public"]["Tables"]["skill_definitions"]["Row"]>;
        Relationships: [];
      };
      skill_definition_versions: {
        Row: {
          id: string;
          skill_id: string;
          version: string;
          definition: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_definition_versions"]["Row"]> &
          Pick<Database["public"]["Tables"]["skill_definition_versions"]["Row"], "skill_id" | "version" | "definition">;
        Update: Partial<Database["public"]["Tables"]["skill_definition_versions"]["Row"]>;
        Relationships: [];
      };
      /** Legacy, organization-scoped, unused by the plugin architecture -- see skill_definition_versions above. */
      skill_versions: {
        Row: {
          id: string;
          organization_id: string;
          skill_id: string;
          version: string;
          definition: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skill_versions"]["Row"]> &
          Pick<Database["public"]["Tables"]["skill_versions"]["Row"], "skill_id" | "version" | "definition">;
        Update: Partial<Database["public"]["Tables"]["skill_versions"]["Row"]>;
        Relationships: [];
      };
      plugin_skill_permissions: {
        Row: {
          id: string;
          organization_id: string;
          plugin_installation_id: string;
          skill_id: string;
          enabled: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_skill_permissions"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_skill_permissions"]["Row"], "plugin_installation_id" | "skill_id">;
        Update: Partial<Database["public"]["Tables"]["plugin_skill_permissions"]["Row"]>;
        Relationships: [];
      };
      plugin_run_contexts: {
        Row: {
          id: string;
          organization_id: string;
          plugin_id: string;
          plugin_version: string;
          skill_id: string;
          skill_version: string;
          actor_user_id: string;
          context: Record<string, unknown>;
          constitutional_reference: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_run_contexts"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["plugin_run_contexts"]["Row"],
            "plugin_id" | "plugin_version" | "skill_id" | "skill_version" | "actor_user_id" | "context"
          >;
        Update: Partial<Database["public"]["Tables"]["plugin_run_contexts"]["Row"]>;
        Relationships: [];
      };
      plugin_runs: {
        Row: {
          id: string;
          organization_id: string;
          plugin_id: string;
          skill_id: string;
          context_snapshot_id: string;
          actor_user_id: string;
          use_case_id: string | null;
          status: PluginRunStatusRow;
          rejection_reason: string | null;
          correlation_id: string;
          output: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_runs"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_runs"]["Row"], "plugin_id" | "skill_id" | "context_snapshot_id" | "actor_user_id" | "correlation_id">;
        Update: Partial<Database["public"]["Tables"]["plugin_runs"]["Row"]>;
        Relationships: [];
      };
      plugin_evidence_outputs: {
        Row: {
          id: string;
          organization_id: string;
          plugin_run_id: string;
          use_case_id: string | null;
          evidence_type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_evidence_outputs"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_evidence_outputs"]["Row"], "plugin_run_id" | "evidence_type">;
        Update: Partial<Database["public"]["Tables"]["plugin_evidence_outputs"]["Row"]>;
        Relationships: [];
      };
      plugin_audit_events: {
        Row: {
          id: string;
          organization_id: string;
          actor: string;
          event_type: string;
          plugin_id: string | null;
          skill_id: string | null;
          plugin_run_id: string | null;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plugin_audit_events"]["Row"]> &
          Pick<Database["public"]["Tables"]["plugin_audit_events"]["Row"], "actor" | "event_type">;
        Update: Partial<Database["public"]["Tables"]["plugin_audit_events"]["Row"]>;
        Relationships: [];
      };
      promotion_requests: {
        Row: {
          id: string;
          organization_id: string;
          source_plugin_id: string;
          source_skill_id: string;
          source_run_id: string;
          request_id: string;
          candidate_id: string;
          signal_ids: string[];
          evidence_ids: string[];
          authority_context: Record<string, unknown>;
          objective: string;
          correlation_id: string;
          context_snapshot_id: string;
          plugin_version: string;
          skill_version: string;
          review_outcome: ReviewOutcomeRow | null;
          evidence_status: EvidenceStatusRow;
          authority_status: AuthorityStatusRow;
          escalation_required: boolean;
          blocked_actions: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["promotion_requests"]["Row"]> &
          Pick<
            Database["public"]["Tables"]["promotion_requests"]["Row"],
            | "source_plugin_id"
            | "source_skill_id"
            | "source_run_id"
            | "request_id"
            | "candidate_id"
            | "objective"
            | "correlation_id"
            | "context_snapshot_id"
            | "plugin_version"
            | "skill_version"
          >;
        Update: Partial<Database["public"]["Tables"]["promotion_requests"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
