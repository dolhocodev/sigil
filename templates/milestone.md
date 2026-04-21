# Milestone Agreement — {title}

> **Agreement ID**: `{id}`
> **Type**: Milestone Agreement
> **Created**: {timestamp}
> **Expires**: {expires}

---

## Parties

| Role | Identifier |
|------|-----------|
| **Responsible Party** | `{partyA}` |
| **Receiving Party** | `{partyB}` |

---

## Milestone Description

{description}

---

## Deliverables & Success Criteria

| # | Deliverable | Success Criteria | Target Date |
|---|-------------|-----------------|-------------|
| 1 | Define scope | Written spec approved | TBD |
| 2 | Implementation | All tests passing | TBD |
| 3 | Delivery | Accepted by receiving party | TBD |

---

## Completion Criteria

The milestone is considered **complete** when:
- All deliverables listed above are accepted by `{partyB}`
- Any automated tests pass at 100%
- A completion commit is made to the registry: `sigil status {id} fulfilled`

---

## Consequences of Missed Milestone

Both parties agree to renegotiate in good faith if the milestone cannot be met on schedule, with 5 business days notice.

---

## Cryptographic Seal

- **Content Hash (SHA-256)**: `{contentHashPlaceholder}`
- **Protocol**: Sigil v0.1.0
- **Registry**: https://github.com/dolhocodev/sigil
- **Verification**: `sigil verify {id}`

*Modifications to this document after signing invalidate all signatures.*

---

*This agreement is a good-faith record of intent. It is not a substitute for professional legal counsel.*
