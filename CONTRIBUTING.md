# 🤝 Contributing to Sovereign-DevKit

> *"Sovereignty is not speed — it is the discipline to preview, confirm, then execute."*

Thank you for considering a contribution. This project is built on the **Mkhitarian Philosophy**: technology should serve human intent, ensure ethical sovereignty, and remain accessible regardless of hardware constraints.

Every contribution, whether code, documentation, or testing, helps strengthen the foundation of intentional, transparent tooling.

---

## 🧭 Core Contribution Principles

| Principle | Expectation |
|-----------|-------------|
| 🎯 **Intent Before Code** | Every change must solve a clear problem or improve safety/clarity |
| 🛡️ **Sovereignty First** | No hidden dependencies, no forced automation, full user control |
| 🔍 **Transparency** | Open, auditable, and documented in plain language |
| 📱 **Mobile-Accessible** | Code and workflows must remain testable on constrained environments |
| ⚡ **Minimalism** | Prefer simple, focused changes over complex refactors |

---

## 📋 How to Contribute

### 🐛 1. Report an Issue
- Search existing issues to avoid duplicates.
- Use the appropriate template: `Bug Report`, `Feature Request`, or `Documentation`.
- Include:
  - LogSanitizer.js version (`node LogSanitizer.js --help`)
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment (Node version, OS, Termux/desktop)
- 🔐 For security vulnerabilities: See [SECURITY.md](SECURITY.md)

### 💻 2. Submit Code or Features
1. **Fork** the repository
2. **Create a branch** focused on one change:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
3. **Make changes** keeping them minimal and well-documented
4. **Test locally** (see [🧪 Testing Guidelines](#-testing-guidelines))
5. **Commit** using Conventional Commits format
6. **Push** and open a Pull Request to `main`

### 📖 3. Improve Documentation
- Fix typos, clarify usage examples, or add mobile-specific tips
- All documentation must remain in English
- Link to philosophy or security references where relevant

---

## 🛠️ Development Workflow

```bash
# 1. Sync with upstream
git fetch origin
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feat/descriptive-name

# 3. Make changes & test
node LogSanitizer.js --help
node LogSanitizer.js ./test-dir --dry-run

# 4. Commit & push
git add .
git commit -m "feat(policy): add custom pattern loader for v3.5"
git push origin feat/descriptive-name
```

---
