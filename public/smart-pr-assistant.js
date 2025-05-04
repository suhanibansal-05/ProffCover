#!/usr/bin/env node

/**
 * Smart PR Assistant
 * 
 * This script fetches the latest open pull request using GitHub CLI,
 * analyzes the changes, and provides a summary including whether
 * test files or documentation were updated.
 * 
 * Requirements:
 * - GitHub CLI (gh) must be installed and authenticated
 * - Node.js
 */

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const TEST_FILE_PATTERNS = [
  /test/i,
  /spec/i,
  /__tests__/,
  /\.test\./,
  /\.spec\./
];

const DOC_FILE_PATTERNS = [
  /readme/i,
  /\.md$/i,
  /docs\//i,
  /documentation/i,
  /wiki/i
];

/**
 * Execute a command and return the output
 */
function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Check if GitHub CLI is installed
 */
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the latest open pull request
 */
function getLatestPR() {
  const prListOutput = executeCommand('gh pr list --limit 1 --json number,title,url,headRefName,author');
  const prList = JSON.parse(prListOutput);
  
  if (prList.length === 0) {
    console.log('No open pull requests found.');
    process.exit(0);
  }
  
  return prList[0];
}

/**
 * Get the diff of the PR
 */
function getPRDiff(prNumber) {
  return executeCommand(`gh pr diff ${prNumber}`);
}

/**
 * Get the list of changed files in the PR
 */
function getChangedFiles(prNumber) {
  const filesOutput = executeCommand(`gh pr view ${prNumber} --json files`);
  const filesData = JSON.parse(filesOutput);
  return filesData.files;
}

/**
 * Check if a file is a test file
 */
function isTestFile(filename) {
  return TEST_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Check if a file is a documentation file
 */
function isDocFile(filename) {
  return DOC_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

/**
 * Analyze the PR changes
 */
function analyzePR(prNumber) {
  console.log('Analyzing PR changes...');
  
  // Get changed files
  const changedFiles = getChangedFiles(prNumber);
  
  // Count stats
  const stats = {
    totalFiles: changedFiles.length,
    additions: changedFiles.reduce((sum, file) => sum + file.additions, 0),
    deletions: changedFiles.reduce((sum, file) => sum + file.deletions, 0),
    testFiles: changedFiles.filter(file => isTestFile(file.path)),
    docFiles: changedFiles.filter(file => isDocFile(file.path)),
    filesByType: {}
  };
  
  // Group files by extension
  changedFiles.forEach(file => {
    const ext = path.extname(file.path).toLowerCase() || 'no-extension';
    if (!stats.filesByType[ext]) {
      stats.filesByType[ext] = [];
    }
    stats.filesByType[ext].push(file.path);
  });
  
  return {
    changedFiles,
    stats
  };
}

/**
 * Generate a summary of the PR changes
 */
function generateSummary(pr, analysis) {
  const { stats } = analysis;
  
  console.log('\n========== PULL REQUEST SUMMARY ==========');
  console.log(`PR #${pr.number}: ${pr.title}`);
  console.log(`Author: ${pr.author.login}`);
  console.log(`Branch: ${pr.headRefName}`);
  console.log(`URL: ${pr.url}`);
  console.log('\n--- Change Statistics ---');
  console.log(`Total files changed: ${stats.totalFiles}`);
  console.log(`Additions: ${stats.additions}`);
  console.log(`Deletions: ${stats.deletions}`);
  
  console.log('\n--- File Types Changed ---');
  Object.entries(stats.filesByType).forEach(([ext, files]) => {
    console.log(`${ext}: ${files.length} file(s)`);
  });
  
  console.log('\n--- Important Flags ---');
  console.log(`Test files updated: ${stats.testFiles.length > 0 ? 'YES' : 'NO'}`);
  if (stats.testFiles.length > 0) {
    console.log('  Test files:');
    stats.testFiles.forEach(file => console.log(`    - ${file.path}`));
  }
  
  console.log(`Documentation updated: ${stats.docFiles.length > 0 ? 'YES' : 'NO'}`);
  if (stats.docFiles.length > 0) {
    console.log('  Documentation files:');
    stats.docFiles.forEach(file => console.log(`    - ${file.path}`));
  }
  
  console.log('\n--- Changed Files ---');
  analysis.changedFiles.forEach(file => {
    console.log(`${file.path} (+${file.additions}, -${file.deletions})`);
  });
  
  console.log('\n=========================================');
}

/**
 * Main function
 */
function main() {
  console.log('Smart PR Assistant');
  
  // Check if GitHub CLI is installed
  if (!checkGitHubCLI()) {
    console.error('Error: GitHub CLI (gh) is not installed or not in PATH.');
    console.error('Please install it from: https://cli.github.com/');
    process.exit(1);
  }
  
  // Get the latest PR
  console.log('Fetching latest open pull request...');
  const pr = getLatestPR();
  console.log(`Found PR #${pr.number}: ${pr.title}`);
  
  // Analyze the PR
  const analysis = analyzePR(pr.number);
  
  // Generate summary
  generateSummary(pr, analysis);
}

// Run the script
main();