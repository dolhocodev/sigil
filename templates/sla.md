# Service Level Agreement — {title}

> **Agreement ID**: `{id}`
> **Type**: Service Level Agreement (SLA)
> **Created**: {timestamp}
> **Expires**: {expires}

---

## Parties

| Role | Identifier |
|------|-----------|
| **Service Provider** | `{partyA}` |
| **Service Consumer** | `{partyB}` |

---

## Service Description

{description}

---

## Service Commitments

| Metric | Commitment |
|--------|-----------|
| **Uptime** | 99.9% monthly |
| **Response Time (p99)** | < 500ms |
| **Incident Response** | < 4 hours |
| **Scheduled Maintenance** | With 48h notice |
| **Support Hours** | Business days 09:00–18:00 UTC |

---

## Incident Management

1. **P0 (Critical)**: Response within 1 hour, resolution within 4 hours.
2. **P1 (High)**: Response within 4 hours, resolution within 24 hours.
3. **P2 (Medium)**: Response within 1 business day.
4. **P3 (Low)**: Response within 3 business days.

---

## Remedies for Breach

If uptime falls below the committed level in any calendar month:

| Uptime | Credit |
|--------|--------|
| 99.0% – 99.9% | 10% of monthly fee |
| 95.0% – 99.0% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

---

## Cryptographic Seal

- **Content Hash (SHA-256)**: `{contentHashPlaceholder}`
- **Protocol**: Sigil v0.1.0
- **Registry**: https://github.com/dolhocodev/sigil
- **Verification**: `sigil verify {id}`

*Modifications to this document after signing invalidate all signatures.*

---

*This agreement is a good-faith record of intent. It is not a substitute for professional legal counsel.*
