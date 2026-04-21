<div align="center">

<br/>

```
  ◆ SIGIL
```

# Your signature, sealed in history.

**A Git-native, GPG-verified agreement protocol.**  
Cryptographically bind freelance contracts, CLAs, SLAs, and milestones  
directly into your Git history — no blockchain, no intermediaries, no trust required.

<br/>

[![Protocol](https://img.shields.io/badge/Protocol-Sigil%20v0.1.0-7C3AED?style=for-the-badge&logo=git)](https://github.com/dolhocodev/sigil)
[![License](https://img.shields.io/badge/License-AGPL--3.0-A78BFA?style=for-the-badge)](LICENSE)
[![npm](https://img.shields.io/badge/npm-%40dolhocodev%2Fsigil-6D28D9?style=for-the-badge&logo=npm)](https://npmjs.com/package/@dolhocodev/sigil)
[![Agreements](https://img.shields.io/badge/Agreements%20in%20Registry-0-4C1D95?style=for-the-badge)](registry/index.json)
[![Site](https://img.shields.io/badge/Docs-dolhocodev.github.io%2Fsigil-4C1D95?style=for-the-badge&logo=github)](https://dolhocodev.github.io/sigil)

</div>

---

## The Insight

**Git is already a blockchain.** Every commit is a SHA-256 hash that includes the previous state, author, and timestamp — forming a cryptographically immutable, distributed ledger. Nobody had used this as a protocol for human agreements.

**Sigil** makes it one.

```
H(commit) = SHA256(tree ∥ parent ∥ author ∥ timestamp ∥ message)

Valid Agreement ⟺
  ∀ party ∈ parties: verify_gpg(party.signature, SHA256(text)) = true
  ∧ contentHash matches current file
  ∧ commit is in the immutable git history
```

---

## Why Git Beats Blockchain for Agreements

| | Ethereum Smart Contract | Sigil |
|---|---|---|
| **Cost per agreement** | $0.01 – $50 | **$0** |
| **Setup time** | Hours (wallet, gas, Solidity) | **30 seconds** |
| **Infrastructure** | Blockchain nodes | **GitHub (free)** |
| **Developer familiarity** | Low | **High (git + gpg)** |
| **Offline access** | No | **Yes (local clone)** |
| **Cryptographic proof** | ✅ | ✅ |
| **Immutability** | ✅ | ✅ |
| **Public auditability** | ✅ | ✅ |

---

## Quickstart

### Install

```bash
npm install -g @dolhocodev/sigil
```

### Create an Agreement

```bash
sigil init
```

```
◆ SIGIL
Your signature, sealed in history.

? Agreement type:  💼  Freelance Contract
? Agreement title: Frontend Development — Q2 2026
? Party A:         alice@github.com
? Party B:         bob@github.com
? Description:     Full redesign of dashboard UI, 3 pages, Figma to code.
? Expiry date:     2026-07-01

✓ Agreement created!
  ID:   a3f9c12e
  Hash: 8d4b2f1a9c7e3b5d...
  File: registry/agreements/a3f9c12e.md

Next steps:
  1. Share the agreement ID with the other party
  2. Each party runs: sigil sign a3f9c12e
  3. Verify with:    sigil verify a3f9c12e
  4. Publish with:   sigil publish a3f9c12e
```

### Sign (each party, on their own machine)

```bash
sigil sign a3f9c12e
# Uses your GPG key — the same one you use for git commits
```

### Verify

```bash
sigil verify a3f9c12e
```

```
◆ a3f9c12e  Frontend Development — Q2 2026
  Type:    freelance
  Parties: alice@github.com ↔ bob@github.com
  Status:  ██ ACTIVE ██
  Hash:    ✓ Verified (untampered)
  Sigs:    ✓ 2 signature(s): alice.asc, bob.asc
  Expires: 2026-07-01
```

### Publish to the Public Registry

```bash
sigil publish a3f9c12e
# → git commit + git push → PR to sigil registry
```

---

## Agreement Types

| Template | Use Case | Command |
|----------|----------|---------| 
| `freelance` | Client ↔ contractor work agreement | `sigil init --template freelance` |
| `cla` | Contributor License Agreement for OSS | `sigil init --template cla` |
| `sla` | Service Level Agreement between teams | `sigil init --template sla` |
| `milestone` | Delivery commitments with success criteria | `sigil init --template milestone` |
| `split` | Revenue sharing between collaborators | `sigil init --template split` |

---

## How It Works

```
Alice                          Sigil Registry (GitHub)             Bob
  │                                     │                           │
  │── sigil init ──────────────────────►│                           │
  │   Creates agreement file            │                           │
  │   Computes SHA-256 content hash     │                           │
  │                                     │                           │
  │── sigil sign ───────────────────────┤                           │
  │   GPG-signs the content hash        │                           │
  │                                     │◄────── sigil sign ────────│
  │                                     │   Bob signs independently  │
  │                                     │                           │
  │── sigil publish ───────────────────►│                           │
  │   git commit + PR to registry       │                           │
  │                                     │                           │
  │             GitHub Actions          │                           │
  │             auto-verifies all sigs  │                           │
  │◄── ✅ Verified ─────────────────────│──── ✅ Verified ──────────►│
  │                                     │                           │
  │   BOTH PARTIES HOLD A LOCAL CLONE — zero dependency on GitHub  │
```

### Security Model

- **Content hash** anchors the agreement text — any modification breaks verification instantly
- **GPG signatures** prove each party's consent cryptographically
- **Git history** provides an immutable, timestamped audit trail
- **Distributed clones** mean the agreement survives even if GitHub goes offline

---

## All Commands

```bash
sigil init [--template <type>]     # Create a new agreement (interactive)
sigil sign <id> [--key <keyid>]    # Sign with your GPG key
sigil verify [id]                   # Verify integrity and signatures
sigil list                          # List all agreements in registry
sigil publish <id>                  # Commit & push to registry
sigil demo                          # Show usage guide
sigil --help                        # Full help
```

---

## Use Sigil for Your Open-Source Project

Replace your PDF CLA with a Sigil agreement:

```markdown
## Contributing

We use [Sigil](https://github.com/dolhocodev/sigil) for contributor agreements.

Before your first PR is merged, run:
\`\`\`bash
npx @dolhocodev/sigil init --template cla --party your@email.com --party project@org.com
\`\`\`
```

---

## Repository Structure

```
sigil/
├── registry/
│   ├── agreements/          ← All agreement documents (.md)
│   │   └── {id}.md
│   ├── signatures/          ← GPG signatures per agreement
│   │   └── {id}/
│   │       ├── party-a.asc
│   │       └── party-b.asc
│   └── index.json           ← Machine-readable registry index
├── templates/               ← Agreement templates
│   ├── freelance.md
│   ├── cla.md
│   ├── sla.md
│   ├── milestone.md
│   └── split.md
├── schema/
│   └── agreement.schema.json ← JSON Schema for validation
├── cli/
│   └── sigil.js             ← CLI entry point
└── .github/
    └── workflows/
        └── verify.yml       ← Auto-verification on every PR
```

---

## Contributing

1. Fork the repository
2. Create your agreement: `sigil init`
3. Sign it: `sigil sign <id>`
4. Open a PR — GitHub Actions will auto-verify

All protocol changes are governed by a Sigil milestone agreement between maintainers.

---

## Roadmap

- [x] Core CLI (`init`, `sign`, `verify`, `publish`, `list`)
- [x] 5 agreement templates
- [x] GitHub Actions auto-verification
- [x] Hash-only fallback (no GPG required)
- [ ] `sigil dispute` — on-chain dispute protocol
- [ ] `sigil status <id> fulfilled` — mark agreements complete
- [ ] Web UI for the public registry
- [ ] GitHub App integration
- [ ] Webhook support (agreement signed → trigger CI)
- [ ] `sigil score` — reputation score based on fulfilled agreements
- [ ] Private registry support (Sigil Pro)
- [ ] Legal PDF export with notarization

---

## License

AGPL-3.0 © [dolhocodev](https://github.com/dolhocodev) and Sigil Protocol Contributors

---

<div align="center">

**Sigil** — *Ancient word. Cryptographic proof.*

[Registry](registry/index.json) · [Templates](templates/) · [Schema](schema/) · [CLI](cli/sigil.js) · [Docs](https://dolhocodev.github.io/sigil)

</div>
