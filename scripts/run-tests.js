#!/usr/bin/env node

/**
 * This script runs all tests and generates coverage reports and badges.
 * It runs both client and server tests and updates the badges in the README files.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Helper function to run a command and log output
function runCommand(command, cwd) {
  console.log(`${colors.bright}${colors.fg.cyan}Running command:${colors.reset} ${command}`);
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: true }
    });
    return { success: true, output };
  } catch (error) {
    console.error(`${colors.fg.red}Command failed:${colors.reset} ${error.message}`);
    return { success: false, error };
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log(`\n${colors.bright}${colors.fg.green}=== Running All Tests and Generating Coverage Reports ===${colors.reset}\n`);
  
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
  
  // Run server tests
  console.log(`\n${colors.bright}${colors.fg.yellow}=== Running Server Tests ===${colors.reset}\n`);
  const serverTestResult = runCommand('npm run test:coverage', serverDir);
  
  if (serverTestResult.success) {
    console.log(`\n${colors.fg.green}Server tests completed successfully${colors.reset}\n`);
    
    // Generate server badges
    console.log(`\n${colors.bright}${colors.fg.yellow}=== Generating Server Badges ===${colors.reset}\n`);
    runCommand('npm run test:badges', serverDir);
  } else {
    console.error(`\n${colors.fg.red}Server tests failed${colors.reset}\n`);
  }
  
  // Run client tests
  console.log(`\n${colors.bright}${colors.fg.yellow}=== Running Client Tests ===${colors.reset}\n`);
  const clientTestResult = runCommand('npm run test:coverage', clientDir);
  
  if (clientTestResult.success) {
    console.log(`\n${colors.fg.green}Client tests completed successfully${colors.reset}\n`);
    
    // Generate client badges
    console.log(`\n${colors.bright}${colors.fg.yellow}=== Generating Client Badges ===${colors.reset}\n`);
    runCommand('npm run test:badges', clientDir);
  } else {
    console.error(`\n${colors.fg.red}Client tests failed${colors.reset}\n`);
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.fg.green}=== Test Summary ===${colors.reset}\n`);
  console.log(`Server Tests: ${serverTestResult.success ? colors.fg.green + 'PASSED' : colors.fg.red + 'FAILED'}${colors.reset}`);
  console.log(`Client Tests: ${clientTestResult.success ? colors.fg.green + 'PASSED' : colors.fg.red + 'FAILED'}${colors.reset}`);
  
  if (serverTestResult.success && clientTestResult.success) {
    console.log(`\n${colors.bright}${colors.fg.green}All tests passed successfully!${colors.reset}`);
    console.log(`\nCoverage reports are available at:`);
    console.log(`  - Server: ${path.join(serverDir, 'coverage', 'lcov-report', 'index.html')}`);
    console.log(`  - Client: ${path.join(clientDir, 'coverage', 'index.html')}`);
    return 0;
  } else {
    console.error(`\n${colors.bright}${colors.fg.red}Some tests failed. Please check the output above for details.${colors.reset}`);
    return 1;
  }
}

// Run the tests
runAllTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error(`${colors.fg.red}Error running tests:${colors.reset}`, error);
    process.exit(1);
  });
