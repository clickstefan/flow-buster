#!/usr/bin/env node

/**
 * Deployment Link Validator
 * 
 * This script validates that GitHub Pages deployment links are working correctly
 * and checks for JavaScript errors on deployed pages.
 * 
 * Usage:
 *   node test-deployment.js [branch-name]
 *   
 * If no branch name is provided, it will test the current git branch.
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_PAGES_BASE = 'https://clickstefan.github.io/flow-buster';
const TIMEOUT_MS = 30000; // 30 seconds
const RETRY_COUNT = 3;
const RETRY_DELAY = 5000; // 5 seconds

class DeploymentTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.errors = [];
    this.warnings = [];
  }

  async init() {
    console.log('🚀 Initializing deployment tester...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Listen for console errors and warnings
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.errors.push(`Console Error: ${text}`);
      } else if (type === 'warning') {
        this.warnings.push(`Console Warning: ${text}`);
      }
    });

    // Listen for page errors
    this.page.on('pageerror', error => {
      this.errors.push(`Page Error: ${error.message}`);
    });

    // Listen for request failures
    this.page.on('requestfailed', request => {
      this.errors.push(`Request Failed: ${request.url()} - ${request.failure().errorText}`);
    });

    console.log('✅ Browser initialized');
  }

  async testUrl(url, expectedElements = []) {
    console.log(`\n🔍 Testing URL: ${url}`);
    
    for (let attempt = 1; attempt <= RETRY_COUNT; attempt++) {
      try {
        this.errors = []; // Reset errors for this attempt
        this.warnings = [];

        console.log(`  Attempt ${attempt}/${RETRY_COUNT}`);
        
        // Navigate to URL with timeout
        const response = await this.page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: TIMEOUT_MS 
        });

        // Check if page loaded successfully
        if (!response || response.status() !== 200) {
          throw new Error(`HTTP ${response?.status() || 'unknown'} response`);
        }

        // Wait for page to be fully loaded
        await this.page.waitForTimeout(2000);

        // Check for expected elements
        for (const selector of expectedElements) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            console.log(`  ✅ Found expected element: ${selector}`);
          } catch (error) {
            this.errors.push(`Missing expected element: ${selector}`);
          }
        }

        // Check for JavaScript errors
        if (this.errors.length === 0) {
          console.log('  ✅ Page loaded successfully');
          console.log('  ✅ No JavaScript errors detected');
          
          if (this.warnings.length > 0) {
            console.log(`  ⚠️  ${this.warnings.length} warnings detected:`);
            this.warnings.forEach(warning => console.log(`    ${warning}`));
          }
          
          return true;
        }

        if (attempt < RETRY_COUNT) {
          console.log(`  ⚠️  Attempt ${attempt} failed, retrying in ${RETRY_DELAY/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
        
      } catch (error) {
        this.errors.push(`Navigation Error: ${error.message}`);
        
        if (attempt < RETRY_COUNT) {
          console.log(`  ⚠️  Attempt ${attempt} failed, retrying in ${RETRY_DELAY/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // All attempts failed
    console.log(`  ❌ URL test failed after ${RETRY_COUNT} attempts`);
    this.errors.forEach(error => console.log(`    ${error}`));
    return false;
  }

  async testBranchDeployment(branchName) {
    console.log(`\n📋 Testing deployment for branch: ${branchName}`);
    
    const results = {
      rootIndex: false,
      branchDeployment: false,
      totalErrors: 0,
      totalWarnings: 0
    };

    // Test 1: Root index page
    console.log('\n1️⃣ Testing root index page...');
    const rootUrl = `${GITHUB_PAGES_BASE}/`;
    results.rootIndex = await this.testUrl(rootUrl, [
      'h1', // Page title
      '.branch-card', // Branch cards should be present
      'a[href*="' + branchName + '"]' // Link to our branch should exist
    ]);

    // Test 2: Branch-specific deployment
    console.log('\n2️⃣ Testing branch deployment...');
    const branchUrl = `${GITHUB_PAGES_BASE}/${branchName}/`;
    results.branchDeployment = await this.testUrl(branchUrl, [
      'title', // Page should have a title
      '#game-container', // Game container should exist
      'script' // JavaScript should be loaded
    ]);

    results.totalErrors = this.errors.length;
    results.totalWarnings = this.warnings.length;

    return results;
  }

  async generateReport(branchName, results) {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      branchName,
      results,
      urls: {
        rootIndex: `${GITHUB_PAGES_BASE}/`,
        branchDeployment: `${GITHUB_PAGES_BASE}/${branchName}/`
      }
    };

    // Write report to file
    const reportPath = 'deployment-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Test report written to: ${reportPath}`);

    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser closed');
    }
  }
}

async function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error('Error getting current branch:', error.message);
    return 'main'; // fallback
  }
}

async function main() {
  // Use BRANCH_NAME environment variable (set by GitHub Actions) or command line arg or current branch
  const branchName = process.env.BRANCH_NAME || process.argv[2] || await getCurrentBranch();
  console.log(`🎯 Testing deployment for branch: ${branchName}`);

  const tester = new DeploymentTester();
  
  try {
    await tester.init();
    const results = await tester.testBranchDeployment(branchName);
    const report = await tester.generateReport(branchName, results);
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 DEPLOYMENT TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Branch: ${branchName}`);
    console.log(`Root Index: ${results.rootIndex ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Branch Deployment: ${results.branchDeployment ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Errors: ${results.totalErrors}`);
    console.log(`Total Warnings: ${results.totalWarnings}`);
    
    console.log('\n🔗 Tested URLs:');
    console.log(`  Root: ${report.urls.rootIndex}`);
    console.log(`  Branch: ${report.urls.branchDeployment}`);
    
    // Exit with error code if tests failed
    const success = results.rootIndex && results.branchDeployment;
    if (!success) {
      console.log('\n❌ DEPLOYMENT TESTS FAILED');
      console.log('   Please check the URLs manually and ensure deployment completed successfully.');
      process.exit(1);
    }
    
    console.log('\n✅ ALL DEPLOYMENT TESTS PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Test terminated');
  process.exit(1);
});

if (require.main === module) {
  main();
}