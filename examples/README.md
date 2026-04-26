# ⚡ 10-Second Demo

See `Sovereign-DevKit` in action — no installation required.

## 🚀 Try it now

From your terminal, run:

```bash
npx sovereign-devkit ./examples --dry-run
```

**You should see:**
- ⚠️ `leak.js` — 5 leaks detected
- ✅ `clean.js` — safe

## 🔧 Now try fixing

```bash
npx sovereign-devkit ./examples --fix
```

→ Files will be sanitized automatically  
→ Original backups saved as `.bak` files

## 🎯 Why this matters

This simulates a **real-world mistake**: accidentally committing secrets before pushing to GitHub.

`Sovereign-DevKit` catches them **before** they become a breach.
