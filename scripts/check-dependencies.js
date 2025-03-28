#!/usr/bin/env node

/**
 * This script checks if all the necessary dependencies are installed
 * for the test badges to work. It checks for the presence of:
 * - jest-coverage-badges
 * - istanbul-badges-readme
 * - nyc
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fg: {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
  }
};

console.log(`\n${colors.bright}${colors.fg.cyan}Checking dependencies for test badges...${colors.reset}\n`);

const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

// Check if directories exist
if (!fs.existsSync(clientDir)) {
  console.error(`${colors.fg.red}Client directory not found:${colors.reset} ${clientDir}`);
  process.exit(1);
}

if (!fs.existsSync(serverDir)) {
  console.error(`${colors.fg.red}Server directory not found:${colors.reset} ${serverDir}`);
  process.exit(1);
}

// Check if package.json files exist
const clientPackageJsonPath = path.join(clientDir, 'package.json');
const serverPackageJsonPath = path.join(serverDir, 'package.json');

if (!fs.existsSync(clientPackageJsonPath)) {
  console.error(`${colors.fg.red}Client package.json not found:${colors.reset} ${clientPackageJsonPath}`);
  process.exit(1);
}

if (!fs.existsSync(serverPackageJsonPath)) {
  console.error(`${colors.fg.red}Server package.json not found:${colors.reset} ${serverPackageJsonPath}`);
  process.exit(1);
}

// Read package.json files
const clientPackageJson = require(clientPackageJsonPath);
const serverPackageJson = require(serverPackageJsonPath);

// Check client dependencies
const clientDeps = {
  ...clientPackageJson.dependencies,
  ...clientPackageJson.devDependencies
};

const serverDeps = {
  ...serverPackageJson.dependencies,
  ...serverPackageJson.devDependencies
};

// Check for required dependencies
const requiredDeps = {
  client: ['jest-coverage-badges'],
  server: ['istanbul-badges-readme', 'nyc']
};

let missingDeps = false;

// Check client dependencies
console.log(`${colors.bright}Checking client dependencies:${colors.reset}`);
for (const dep of requiredDeps.client) {
  if (clientDeps[dep]) {
    console.log(`  ${colors.fg.green}✓${colors.reset} ${dep} (${clientDeps[dep]})`);
  } else {
    console.log(`  ${colors.fg.red}✗${colors.reset} ${dep} (missing)`);
    missingDeps = true;
  }
}

// Check server dependencies
console.log(`\n${colors.bright}Checking server dependencies:${colors.reset}`);
for (const dep of requiredDeps.server) {
  if (serverDeps[dep]) {
    console.log(`  ${colors.fg.green}✓${colors.reset} ${dep} (${serverDeps[dep]})`);
  } else {
    console.log(`  ${colors.fg.red}✗${colors.reset} ${dep} (missing)`);
    missingDeps = true;
  }
}

// Summary
if (missingDeps) {
  console.log(`\n${colors.fg.yellow}Some dependencies are missing. Please install them:${colors.reset}`);
  
  // Check client dependencies
  const missingClientDeps = requiredDeps.client.filter(dep => !clientDeps[dep]);
  if (missingClientDeps.length > 0) {
    console.log(`\n${colors.bright}Install missing client dependencies:${colors.reset}`);
    console.log(`  cd client && npm install --save-dev ${missingClientDeps.join(' ')}`);
  }
  
  // Check server dependencies
  const missingServerDeps = requiredDeps.server.filter(dep => !serverDeps[dep]);
  if (missingServerDeps.length > 0) {
    console.log(`\n${colors.bright}Install missing server dependencies:${colors.reset}`);
    console.log(`  cd server && npm install --save-dev ${missingServerDeps.join(' ')}`);
  }
  
  process.exit(1);
} else {
  console.log(`\n${colors.fg.green}All dependencies are installed!${colors.reset}`);
  process.exit(0);
}
