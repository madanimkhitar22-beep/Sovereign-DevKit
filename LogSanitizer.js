#!/usr/bin/env node
/**
 * ============================================================
 *  Sovereign-DevKit: LogSanitizer.js  v3.1
 *  Advanced Sensitive Data Detector & Log Sanitizer
 * ------------------------------------------------------------
 *  Author  : El Madani El Mkhitar
 *  Project : Sovereign-DevKit (Mkhitarian Philosophy)
 *  License : MIT
 *  Built on: Redmi Note 10 — Tetouan, Morocco
 * ============================================================
 *
 *  USAGE:
 *    node LogSanitizer.js <file>                    — scan a single file
 *    node LogSanitizer.js <folder>                  — scan all files in folder
 *    node LogSanitizer.js <folder> --ext .js,.ts    — filter by extension
 *    node LogSanitizer.js <file>   --fix            — redact leaks in-place
 *    node LogSanitizer.js <file>   --dry-run        — preview changes only
 *    node LogSanitizer.js <file>   --no-backup      — skip .bak creation
 * ============================================================
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
//  SENSITIVE PATTERNS
//  Each pattern is a fresh RegExp per test call
//  to avoid the JavaScript regex lastIndex bug.
// ─────────────────────────────────────────────
const SENSITIVE_PATTERNS = [
  // Cloud & Platform Keys
  { name: 'Google API Key',         source: /AIza[0-9A-Za-z\-_]{35}/                                          },
  { name: 'Google OAuth Token',     source: /ya29\.[0-9A-Za-z\-_]+/                                           },
  { name: 'AWS Access Key ID',      source: /AKIA[0-9A-Z]{16}/                                                },
  { name: 'AWS Secret Access Key',  source: /(?<![A-Za-z0-9\/+=])(?![=\/+]{40})[A-Za-z0-9\/+=]{40}(?![A-Za-z0-9\/+=])/ },
  { name: 'Azure Storage Key',      source: /DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+/ },

  // AI & ML Services
  { name: 'OpenAI API Key',         source: /sk-[a-zA-Z0-9]{48}/                                              },
  { name: 'Anthropic API Key',      source: /sk-ant-[a-zA-Z0-9\-_]{93}/                                       },
  { name: 'HuggingFace Token',      source: /hf_[a-zA-Z0-9]{39}/                                              },

  // Payment Processors
  { name: 'Stripe Secret Key',      source: /sk_live_[0-9a-zA-Z]{24}/                                         },
  { name: 'Stripe Publishable Key', source: /pk_live_[0-9a-zA-Z]{24}/                                         },
  { name: 'Square Access Token',    source: /sq0atp-[0-9A-Za-z\-_]{22}/                                       },
  { name: 'PayPal Token',           source: /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/            },
  { name: 'Braintree Access Token', source: /access_token\$[a-zA-Z0-9_]{1,50}/                                },
  // Version Control & CI
  { name: 'GitHub Token (Classic)', source: /ghp_[a-zA-Z0-9]{36}/                                             },
  { name: 'GitHub OAuth Token',     source: /gho_[a-zA-Z0-9]{36}/                                             },
  { name: 'GitHub Actions Token',   source: /ghs_[a-zA-Z0-9]{36}/                                             },
  { name: 'GitLab Token',           source: /glpat-[a-zA-Z0-9\-_]{20}/                                        },

  // Communication Services
  { name: 'Twilio Account SID',     source: /AC[a-fA-F0-9]{32}/                                               },
  { name: 'Twilio Auth Token',      source: /SK[a-fA-F0-9]{32}/                                               },
  { name: 'Mailchimp API Key',      source: /[0-9a-f]{32}-us[0-9]{1,2}/                                       },
  { name: 'SendGrid API Key',       source: /SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}/                     },
  { name: 'Slack Bot Token',        source: /xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}/                        },
  { name: 'Slack Webhook URL',      source: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]+\/B[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+/ },

  // Database & Infrastructure
  { name: 'MongoDB Connection',     source: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/                                },
  { name: 'PostgreSQL Connection',  source: /postgres(?:ql)?:\/\/[^:]+:[^@]+@/                                },
  { name: 'MySQL Connection',       source: /mysql:\/\/[^:]+:[^@]+@/                                          },
  { name: 'Redis URL with Auth',    source: /redis:\/\/:[^@]+@/                                               },

  // Crypto & Web3
  { name: 'Private Key (Hex)',      source: /(?:private[_\-]?key|privkey)\s*[:=]\s*['"]?[0-9a-fA-F]{64}['"]?/i },
  { name: 'Ethereum Private Key',   source: /0x[0-9a-fA-F]{64}/                                               },
  { name: 'Mnemonic Phrase',        source: /(?:mnemonic|seed[_\-]?phrase)\s*[:=]\s*['"][^'"]{50,}['"]/i      },

  // Generic Sensitive Assignments
  { name: 'Generic API Key',        source: /(?:api[_\-]?key|apikey)\s*[:=]\s*['"][^'"]{16,}['"]/i            },
  { name: 'Generic Secret',         source: /(?:secret|client[_\-]?secret)\s*[:=]\s*['"][^'"]{8,}['"]/i       },
  { name: 'Generic Password',       source: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{6,}['"]/i             },
  { name: 'Bearer Token',           source: /Bearer\s+[a-zA-Z0-9\-_\.=]{20,}/                                 },
  { name: 'Basic Auth Header',      source: /Authorization:\s*Basic\s+[a-zA-Z0-9+\/=]{16,}/i                  },
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Test a single line against all patterns.
 * Creates a fresh RegExp each time to avoid lastIndex drift.
 * @param {string} line
 * @param {number} lineNumber  (1-based)
 * @returns {Array<{name, lineNumber, preview}>}
 */
function scanLine(line, lineNumber) {
  const hits = [];
  for (const { name, source } of SENSITIVE_PATTERNS) {
    const regex = new RegExp(source.source, 'i');
    if (regex.test(line)) {      const preview = line.trim().replace(regex, '[REDACTED]');
      hits.push({ name, lineNumber, preview });
    }
  }
  return hits;
}

/**
 * Redact all sensitive values in a string (for --fix mode).
 * @param {string} content
 * @returns {string}
 */
function redactContent(content) {
  let result = content;
  for (const { source } of SENSITIVE_PATTERNS) {
    const regex = new RegExp(source.source, 'gi');
    result = result.replace(regex, '[REDACTED]');
  }
  return result;
}

/**
 * Create a backup of the file before modification.
 * @param {string} filePath
 * @param {string} content
 */
function createBackup(filePath, content) {
  const backupPath = `${filePath}.bak`;
  fs.writeFileSync(backupPath, content, 'utf8');
  return backupPath;
}

/**
 * Export scan results to report.json
 * @param {Array} results
 * @param {string} target
 */
function exportReport(results, target) {
  const report = {
    timestamp: new Date().toISOString(),
    target: path.resolve(target),
    totalLeaks: results.reduce((sum, r) => sum + r.leaks, 0),
    files: results.filter(r => r.leaks > 0)
  };
  fs.writeFileSync('report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log(`  📄 Report exported → report.json`);
}

/**
 * Scan a single file. Returns leak info object. * @param {string} filePath
 * @param {object} options
 * @returns {{filePath, leaks, hits: Array}}
 */
function scanFile(filePath, options = {}) {
  let data;
  try {
    data = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`  [ERROR] Cannot read "${filePath}": ${err.message}`);
    return { filePath, leaks: 0, hits: [] };
  }

  const lines   = data.split('\n');
  const allHits = [];

  lines.forEach((line, idx) => {
    const hits = scanLine(line, idx + 1);
    hits.forEach(hit => allHits.push(hit));
  });

  const relPath = path.relative(process.cwd(), filePath);
  
  if (allHits.length === 0) {
    console.log(`  [✅ SAFE]  ${relPath}`);
    return { filePath, leaks: 0, hits: [] };
  }

  console.log(`  [⚠️  LEAK]  ${relPath}  — ${allHits.length} issue(s)`);
  allHits.forEach(({ name, lineNumber, preview }) => {
    console.warn(`             → Line ${lineNumber} | ${name}`);
    console.warn(`               ${preview}`);
  });

  // ── Auto-fix logic with safety layers ──
  if (options.fix) {
    if (options.dryRun) {
      console.log(`             🔍 [DRY-RUN] Would redact ${allHits.length} item(s) in ${relPath}`);
    } else {
      if (options.backup) {
        const backupPath = createBackup(filePath, data);
        console.log(`             💾 Backup saved → ${path.basename(backupPath)}`);
      }
      const sanitized = redactContent(data);
      fs.writeFileSync(filePath, sanitized, 'utf8');
      console.log(`             ✏️  File redacted and saved.`);
    }
  }

  return { filePath, leaks: allHits.length, hits: allHits };}

/**
 * Recursively scan a directory.
 * @param {string} dirPath
 * @param {object} options
 * @returns {Array<{filePath, leaks, hits}>}
 */
function scanDirectory(dirPath, options = {}) {
  const results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, options));
    } else if (entry.isFile()) {
      if (options.extensions && options.extensions.length > 0) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!options.extensions.includes(ext)) continue;
      }
      results.push(scanFile(fullPath, options));
    }
  }
  return results;
}

// ─────────────────────────────────────────────
//  CLI ENTRY POINT
// ─────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
╔══════════════════════════════════════════════╗
║      Sovereign-DevKit: LogSanitizer v3.1     ║
║      Built by El Madani El Mkhitar           ║
╚══════════════════════════════════════════════╝

USAGE:
  node LogSanitizer.js <target> [options]

ARGUMENTS:
  <target>           File or folder path to scan

OPTIONS:
  --fix              Redact detected leaks in-place  --dry-run          Preview changes without modifying files (use with --fix)
  --backup           Create .bak backup before fixing (default: ON)
  --no-backup        Skip backup creation when using --fix
  --ext <exts>       Comma-separated extensions to scan
                     e.g. --ext .js,.ts,.env,.json
  --report           Export results to report.json
  --help, -h         Show this help message

SAFETY FIRST:
  • Always test with --dry-run before using --fix
  • Backups are saved as <file>.bak by default
  • Run without --fix for read-only scanning

EXAMPLES:
  node LogSanitizer.js ./src
  node LogSanitizer.js server.js --dry-run
  node LogSanitizer.js ./project --fix --backup
  node LogSanitizer.js ./project --ext .js,.env --report
    `);
    process.exit(0);
  }

  const target     = args[0];
  const fix        = args.includes('--fix');
  const dryRun     = args.includes('--dry-run');
  const backup     = !args.includes('--no-backup'); // ON by default
  const exportRep  = args.includes('--report');

  // Parse --ext flag
  let extensions = [];
  const extIndex = args.indexOf('--ext');
  if (extIndex !== -1 && args[extIndex + 1]) {
    extensions = args[extIndex + 1]
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
  }

  const options = { fix, dryRun, backup, extensions };

  // Validate target
  if (!fs.existsSync(target)) {
    console.error(`[ERROR] Target not found: "${target}"`);
    process.exit(1);
  }

  // ── Header ──
  console.log(`
╔══════════════════════════════════════════════╗
║      Sovereign-DevKit: LogSanitizer v3.1     ║╚══════════════════════════════════════════════╝
  Target     : ${path.resolve(target)}
  Fix mode   : ${fix ? (dryRun ? 'DRY-RUN 🔍' : 'ON ⚠️') : 'OFF (read-only)'}
  Backup     : ${fix && !dryRun ? (backup ? 'ON 💾' : 'OFF') : 'N/A'}
  Extensions : ${extensions.length ? extensions.join(', ') : 'all files'}
  Patterns   : ${SENSITIVE_PATTERNS.length} detectors active
──────────────────────────────────────────────`);

  const stat = fs.statSync(target);
  let results = [];

  if (stat.isFile()) {
    results = [scanFile(target, options)];
  } else if (stat.isDirectory()) {
    results = scanDirectory(target, options);
  } else {
    console.error('[ERROR] Target must be a file or directory.');
    process.exit(1);
  }

  // ── Export report if requested ──
  if (exportRep) {
    exportReport(results, target);
  }

  // ── Summary ──
  const totalLeaks = results.reduce((sum, r) => sum + r.leaks, 0);
  console.log('──────────────────────────────────────────────');
  
  if (totalLeaks === 0) {
    console.log('[✅ ALL CLEAR] No sensitive data detected.');
    process.exit(0);
  } else {
    if (dryRun) {
      console.log(`[🔍 DRY-RUN] ${totalLeaks} leak(s) would be redacted.`);
      console.log('   Run without --dry-run to apply changes.');
    } else if (!fix) {
      console.log(`[⚠️  ACTION REQUIRED] ${totalLeaks} leak(s) detected.`);
      console.log('   Run with --fix to automatically redact leaks.');
      console.log('   Tip: Use --dry-run first to preview changes.');
    } else {
      console.log(`[✅ FIXED] ${totalLeaks} leak(s) processed.`);
      if (backup) console.log('   Original files saved as .bak');
    }
    process.exit(fix && !dryRun ? 0 : 1);
  }
}

main();
