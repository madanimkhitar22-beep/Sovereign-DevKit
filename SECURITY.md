# 🔐 Security Policy — Sovereign-DevKit

> *"Sovereignty is not speed — it is the discipline to preview, confirm, then execute."*

This document outlines security practices, backup recovery procedures, and responsible disclosure guidelines for **Sovereign-DevKit**, aligned with the Mkhitarian Philosophy of ethical, intentional execution.

---

## 📋 Supported Versions

| Version | Status | Security Support |
|---------|--------|-----------------|
| **v3.1.x** | ✅ Current | Full support + patches |
| **v3.0.x** | 🟡 Maintenance | Critical fixes only |
| **< v3.0** | 🔴 End-of-Life | No security updates |

> 🔄 **Recommendation:** Always use the latest `v3.1.x` release for safety controls (`--dry-run`, `--backup`, `--report`).

---

## 🛡️ Core Security Principles

1. **Intent Before Execution** — Preview changes with `--dry-run` before applying fixes.
2. **Sovereignty Over Convenience** — Auto-backups (`.bak`) are enabled by default; you control your data.
3. **Transparency By Design** — All detection patterns are visible in-source; no hidden logic.
4. **Zero-Trust Output** — Detected values are redacted (`[REDACTED]`) even in scan logs.
5. **Minimal Attack Surface** — Zero external dependencies; pure Node.js built-ins only.

---

## 💾 Backup & Recovery Guide (v3.1+)

### How Backups Work
When using `--fix` (with default `--backup`), `LogSanitizer.js` creates a `.bak` copy **before** modifying any file:

```bash
# Original file
config.js

# After: node LogSanitizer.js config.js --fix
config.js      # ← Sanitized (leaks redacted)
config.js.bak  # ← Original content preserved
```

### Recovery Steps
If you need to restore a file after redaction:

```bash
# 1. Verify the backup exists
ls -la config.js.bak
# 2. Restore the original
cp config.js.bak config.js

# 3. (Optional) Re-scan with stricter filters
node LogSanitizer.js config.js --ext .js --dry-run
```

### Best Practices
- ✅ Always test with `--dry-run` first
- ✅ Keep `.bak` files locally until you confirm the fix is correct
- ✅ Delete `.bak` files only after verification: `rm *.bak`
- ❌ Never commit `.bak` files to version control (ignored by default in `.gitignore`)

---

## 🐛 Reporting False Positives

If `LogSanitizer.js` flags a value that is **not** a sensitive leak:

### Step 1: Verify Context
Check if the value appears in:
- Test/mock files (`test/`, `mocks/`, `__tests__/`)
- Documentation or comments
- Example configuration (`.env.example`)

### Step 2: Use Context-Aware Scanning (v3.5+ upcoming)
Future versions will auto-ignore known safe patterns. For now, use extension filtering:

```bash
# Scan only production-relevant files
node LogSanitizer.js ./src --ext .js,.ts,.env
```

### Step 3: Report the Pattern
Open an issue with:
```markdown
## False Positive Report

- **File path**: `path/to/file.js`
- **Flagged pattern**: `[paste the regex name or sample]`
- **Why it's safe**: [brief explanation]
- **LogSanitizer.js version**: `v3.1.0`
```

🔗 [→ Open a New Issue](https://github.com/madanimkhitar22-beep/Sovereign-DevKit/issues/new)

---

## 🚨 Responsible Disclosure
If you discover a **genuine security vulnerability** in Sovereign-DevKit:

### ✅ Do:
- Contact the maintainer privately first (see below)
- Provide reproducible steps and impact assessment
- Allow reasonable time for a fix before public disclosure

### ❌ Don't:
- Exploit the vulnerability beyond testing
- Disclose details publicly before a patch is released
- Access or modify data you don't own

### 📬 Contact
- **Primary**: [GitHub Issue (private template)](https://github.com/madanimkhitar22-beep/Sovereign-DevKit/issues/new?template=security.md)
- **Secondary**: [ORCID Profile](https://orcid.org/0009-0009-6663-902X) → Find contact info
- **Response Time**: Within 72 hours for critical issues

---

## 🧪 Security Testing Checklist (For Contributors)

Before submitting a PR that modifies detection logic:

```bash
# 1. Run dry-run on test suite
node LogSanitizer.js ./tests --dry-run

# 2. Verify no false positives on clean files
node LogSanitizer.js ./src --ext .js --report

# 3. Confirm backup behavior
echo "TEST=sk-test-fake-key" > test.env
node LogSanitizer.js test.env --fix
[ -f test.env.bak ] && echo "✅ Backup created"

# 4. Clean up test artifacts
rm -f test.env test.env.bak report.json
```

---

## 🌐 Threat Model Overview

| Threat | Mitigation |
|--------|------------|
| 🔑 Accidental key exposure | 35-pattern detection + `--fix` redaction |
| 📦 Leaked scan logs | Output values auto-redacted (`[REDACTED]`) |
| 💥 Malicious regex injection | Fresh `RegExp` per call; no `eval()` or dynamic code |
| 📱 Mobile environment risks | Zero dependencies; no network calls; local-only execution || 🔄 CI/CD pipeline leaks | `--dry-run` mode for safe pre-merge checks |

---

## 🧭 Philosophy Alignment

> *"Architecture is a product of thought — not infrastructure. Constraints refine systems instead of limiting them."*

Every security decision in Sovereign-DevKit reflects the **Mkhitarian Principles**:

- 🎯 **Intent**: Tools require conscious approval before modification
- 🛡️ **Sovereignty**: Users retain full control over backups and data
- 🔍 **Transparency**: All logic is open-source and auditable
- ⚡ **Simplicity**: Minimal code = minimal attack surface
- 📱 **Human-First**: Designed for mobile developers with limited resources

---

## 📄 License & Attribution

- **License**: [MIT](LICENSE)
- **Author**: [El Madani El Mkhitar](https://github.com/madanimkhitar22-beep)
- **Philosophy**: [Mkhitarian Philosophy](https://github.com/madanimkhitar22-beep/Mekhitarian-Philosophy-)

> *"In the Name of the Creator, We Build."*

---

<div align="center">

[🔙 Back to README](README.md) • [🚀 View Releases](https://github.com/madanimkhitar22-beep/Sovereign-DevKit/releases)

</div>
