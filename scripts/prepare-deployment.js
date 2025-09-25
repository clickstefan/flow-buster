#!/usr/bin/env node

/**
 * Multi-branch deployment preparation script
 * Organizes built files into branch-specific directories
 * and generates the root index
 */

const fs = require('fs');
const path = require('path');
const { generateBranchIndex } = require('./generate-branch-index');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  entries.forEach(entry => {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function prepareBranchDeployment() {
  const branchName = process.env.GITHUB_REF_NAME || process.env.BRANCH || 'main';
  const isPR = process.env.GITHUB_EVENT_NAME === 'pull_request';
  const prNumber = process.env.GITHUB_PR_NUMBER;
  
  // Use PR number for PR builds, otherwise branch name
  const deploymentName = isPR ? `pr-${prNumber}` : branchName;
  
  const buildDir = './dist';
  const deployDir = './gh-pages';
  const branchDeployDir = path.join(deployDir, deploymentName);
  
  console.log(`Preparing deployment for: ${deploymentName}`);
  console.log(`Source: ${buildDir}`);
  console.log(`Destination: ${branchDeployDir}`);
  
  // Create deployment structure
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  
  // Copy current build to branch directory
  if (fs.existsSync(buildDir)) {
    console.log('Copying build files...');
    copyDirectory(buildDir, branchDeployDir);
    console.log(`✅ Files copied to ${branchDeployDir}`);
  } else {
    console.error(`Build directory ${buildDir} does not exist!`);
    process.exit(1);
  }
  
  // Generate metadata for this deployment
  const metadata = {
    branch: branchName,
    deployment: deploymentName,
    commit: process.env.GITHUB_SHA || 'unknown',
    timestamp: new Date().toISOString(),
    isPR,
    prNumber: isPR ? prNumber : null
  };
  
  // Save metadata
  const metadataPath = path.join(branchDeployDir, '.deployment-info.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Generate root index
  console.log('Generating root index...');
  const rootIndexPath = path.join(deployDir, 'index.html');
  const indexHtml = generateBranchIndex(deployDir);
  fs.writeFileSync(rootIndexPath, indexHtml);
  console.log(`✅ Root index generated at ${rootIndexPath}`);
  
  return {
    deployDir,
    branchDeployDir,
    deploymentName,
    metadata
  };
}

// CLI usage
if (require.main === module) {
  try {
    const result = prepareBranchDeployment();
    console.log('\n🎉 Deployment preparation completed!');
    console.log(`Deployment name: ${result.deploymentName}`);
    console.log(`Deploy directory: ${result.deployDir}`);
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

module.exports = { prepareBranchDeployment, copyDirectory };