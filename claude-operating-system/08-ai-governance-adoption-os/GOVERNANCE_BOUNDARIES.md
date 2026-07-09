# Governance Lab v0.4 — Governance Boundaries

Status:
SUPPORTING GOVERNANCE BOUNDARY INDEX

Parent extension:
`README.md`

Parent folder:
`claude-operating-system/08-ai-governance-adoption-os/`

This file is a supporting boundary index for Governance Lab v0.4. It does not define, redefine, or replace KFSA or SDGM. It does not implement runtime code, create database tables, or create CI checks.

## External Source-of-Truth Boundaries

### KFSA Boundary

KFSA is a governed decision framework maintained in its own source-of-truth repository.

This folder does not define KFSA.

This folder does not redefine KFSA.

This folder does not create a competing KFSA scoring model.

This folder does not create a replacement verdict system.

This folder may reference KFSA only as an applied decision-gate interface.

KFSA must always preserve:

KILL / FIX / SCALE / ALERT

ALERT must not be dropped. ALERT is preserved.

KFSA must not be collapsed.

### SDGM Boundary

SDGM is not defined in this folder.

SDGM is not redefined in this folder.

SDGM may be referenced only as a governed signal-to-decision meaning and legitimacy model.

This folder must not redefine:

- Signal
- Decision
- Evidence
- Authority
- Audit
- Execution

### Agent Governance Boundary

Agent Governance is not KFSA Core.

Agent Governance must not be merged into KFSA Core.

Agent/tool governance may provide:
- use case triage
- permission boundaries
- tool governance
- evidence requirements
- runtime checks
- evaluation gates
- escalation rules
- audit requirements

KFSA remains the applied verdict interface when a governed decision treatment is required.

AI Output is not a Decision.

AI Recommendation is not Authority.

RAG is Retrieval, not Authority.

## Relationship to Other Governance Lab Extensions

| Extension | Role | Relationship to v0.4 |
|---|---|---|
| Governance Baseline v0.1 | Closed governance baseline | v0.4 does not reopen or modify it |
| Governance Lab v0.2 — Decision Council Extension | Council-style review skill | v0.4 may use it as review pattern, not replace it |
| Governance Lab v0.3 — Agent Engineering Extension | Agent architecture, vocabulary, operating model, runtime reference architecture | v0.4 consumes agent engineering boundaries but focuses on adoption and operating artifacts |
| Governance Lab v0.4 — AI Governance & Agent Adoption OS | Internal AI adoption operating system | Converts methodology into operational artifacts |

## Prohibited v0.4 Drift

v0.4 must not:

- become generic AI consulting content
- become marketing copy
- redefine KFSA
- redefine SDGM
- merge Agent Governance into KFSA Core
- claim live runtime enforcement
- claim CI automation
- claim customer deployment
- claim AI governance runtime implementation is complete
- claim agent runtime implementation is complete
- treat RAG as authority
- treat AI output as decision
- treat MERGE READY as automatic merge authorization
- drop ALERT from KFSA
- collapse KFSA into three options
- create product-specific NCGR or ESTARED logic except as applied examples
- build client offers before internal operating artifacts exist

## Notion-to-GitHub Translation Rule

Notion is the methodology knowledge base.

GitHub is the controlled implementation and operating artifact repository.

When methodology exists in Notion:
- summarize it as source context
- preserve source-of-truth boundaries
- convert it into operational artifacts
- avoid duplication
- avoid redefinition
- avoid unsupported claims

When GitHub artifacts are created:
- keep them narrow
- keep them versioned
- keep them reviewable
- include implementation boundaries
- include audit notes
- require PR review

## Non-Negotiable Rules

- KFSA is not defined here.
- KFSA is not redefined here.
- KFSA is not collapsed.
- ALERT is preserved.
- SDGM is not redefined here.
- Agent Governance is not KFSA Core.
- Agent/tool governance must fail closed.
- AI Output is not a Decision.
- AI Recommendation is not Authority.
- AI Automation is not Execution Permission.
- RAG is Retrieval, not Authority.
- Retrieved Context is Evidence Input, not Decision.
- No execution without authority.
- No execution without decision.
- No decision without evidence.
- No governance without audit.
- No AI action without boundaries.
- MERGE READY remains a review recommendation only, not automatic merge authorization.
- No operational artifact, no merge.

## Implementation Boundary

This file does not implement runtime code.

This file does not create database tables.

This file does not create CI checks.

This file does not create algorithms.

This file does not create scoring models.

This file does not create agent runtime files.

This file does not create customer deployment assets.

This file does not replace human authority.

This file does not redefine SDGM, KFSA, Signal, Decision, NCGR, ESTARED, or NEXGEGL.

This file is a supporting governance boundary index. It is not final methodology. It is not runtime implementation.
