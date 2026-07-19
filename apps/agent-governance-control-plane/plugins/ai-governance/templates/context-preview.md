# {{organization_name}} — AI Governance Context Projection

> Generated projection, not the source of truth. The database rows behind
> `organization_profiles`, `domain_profiles`, and `plugin_installations` are
> authoritative. This file (or its in-app rendering) is regenerated from
> them; edits here are never written back.

- Sector: {{sector}}
- Jurisdictions: {{jurisdictions}}
- Governance model: {{governance_model}}
- AI governance owner: {{ai_governance_owner}}
- Risk appetite: {{risk_appetite}}
- Escalation threshold: {{escalation_threshold_risk_level}}
- Human review required: {{human_review_required}}
- Approved connectors: {{approved_connector_ids}}
- Applicable internal policies: {{applicable_internal_policies}}

## Plugin: ai-governance

- Version installed: {{plugin_version}}
- Installation status: {{installation_status}}
- production_approval_status: false (locked)

## Constitutional boundary

This organization's AI governance activity operates under the boundary
documented in `docs/architecture/ADR-vertical-plugin-foundation-v1.md`:
no plugin, skill, or connector may create a formal decision, generate a
KFSA decision identifier, or select KILL/FIX/SCALE/ALERT as an official
decision. Formal decisions are issued only by KFSA Core after governed
evaluation and authority approval.
