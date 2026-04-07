/**
 * Sovereign-DevKit: LogSanitizer.js
 * Advanced Sensitive Data Detector
 */

const fs = require('fs');

const SENSITIVE_PATTERNS = [
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{48}/g },
  { name: 'Square Token', regex: /sq0atp-[0-9A-Za-z-_]{22}/g },
  { name: 'PayPal Token', regex: /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/g },
  { name: 'Mailchimp Key', regex: /[0-9a-f]{32}-us[0-9]{2}/g }
];

function sanitizeFile(filePath) {
  console.log(`[Sovereign-DevKit] Scanning ${filePath}...`);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`[ERROR] ${err.message}`);
      process.exit(1);
    }

    let foundLeaks = 0;
    const lines = data.split('\n');

    lines.forEach((line, index) => {
      SENSITIVE_PATTERNS.forEach(({ name, regex }) => {
        if (regex.test(line)) {
          foundLeaks++;
          console.warn(
            `[ALERT] ${name} detected at line ${index + 1}: ${line.trim()}`
          );
        }
      });
    });

    if (foundLeaks === 0) {
      console.log(`[SAFE] No leaks detected.`);
      process.exit(0);
    } else {
      console.log(`[ACTION REQUIRED] ${foundLeaks} issue(s) detected.`);
      process.exit(1);
    }
  });
}

const filePath = process.argv[2];

if (!filePath) {
  console.log('Usage: node LogSanitizer.js <file-path>');
  process.exit(1);
}

sanitizeFile(filePath);
