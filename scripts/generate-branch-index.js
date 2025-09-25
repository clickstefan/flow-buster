#!/usr/bin/env node

/**
 * Generates an index page for all branch builds
 * This script creates a landing page that lists all available branch deployments
 */

const fs = require('fs');
const path = require('path');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    if (stats.isFile()) {
      totalSize += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    }
  }
  
  try {
    calculateSize(dirPath);
  } catch (err) {
    console.warn(`Could not calculate size for ${dirPath}:`, err.message);
  }
  
  return totalSize;
}

function generateBranchIndex(deployDir, branchesMetadata = []) {
  const currentBranch = process.env.GITHUB_REF_NAME || 'main';
  const currentCommit = process.env.GITHUB_SHA || 'unknown';
  
  // If no metadata provided, scan for existing branches
  if (branchesMetadata.length === 0) {
    try {
      const branches = fs.readdirSync(deployDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.'));
      
      branchesMetadata = branches.map(branch => {
        const branchPath = path.join(deployDir, branch);
        const indexPath = path.join(branchPath, 'index.html');
        const lastModified = fs.existsSync(indexPath) 
          ? fs.statSync(indexPath).mtime 
          : new Date();
        const size = getDirectorySize(branchPath);
        
        return {
          name: branch,
          path: branch,
          lastModified,
          size: formatBytes(size),
          rawSize: size
        };
      });
    } catch (err) {
      console.log('No existing branches found, creating initial deployment');
    }
  }
  
  // Add current branch to metadata if not already present
  const currentBranchExists = branchesMetadata.find(b => b.name === currentBranch);
  if (!currentBranchExists) {
    const currentBranchPath = path.join(deployDir, currentBranch);
    const size = fs.existsSync(currentBranchPath) ? getDirectorySize(currentBranchPath) : 0;
    
    branchesMetadata.push({
      name: currentBranch,
      path: currentBranch,
      lastModified: new Date(),
      size: formatBytes(size),
      rawSize: size
    });
  }
  
  // Sort branches by last modified (most recent first)
  branchesMetadata.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flow Buster - Branch Deployments</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            padding: 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            color: #6B46C1;
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .header p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .branch-list {
            display: grid;
            gap: 20px;
        }
        
        .branch-card {
            background: white;
            border: 1px solid #e5e5e5;
            border-radius: 12px;
            padding: 24px;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            text-decoration: none;
            color: inherit;
        }
        
        .branch-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            border-color: #6B46C1;
        }
        
        .branch-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .branch-name {
            font-size: 1.25rem;
            font-weight: 600;
            color: #6B46C1;
            margin: 0;
        }
        
        .branch-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .main-branch {
            background: #10B981;
            color: white;
        }
        
        .develop-branch {
            background: #F59E0B;
            color: white;
        }
        
        .feature-branch {
            background: #6B7280;
            color: white;
        }
        
        .branch-meta {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            font-size: 0.9rem;
            color: #666;
        }
        
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        
        .meta-label {
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .meta-value {
            color: #6B7280;
        }
        
        .no-branches {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .no-branches h3 {
            margin-bottom: 10px;
            color: #374151;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e5e5e5;
            color: #666;
            font-size: 0.9rem;
        }
        
        .footer a {
            color: #6B46C1;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .branch-meta {
                grid-template-columns: 1fr;
                gap: 12px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 Flow Buster</h1>
            <p>Branch Deployments & Build Archive</p>
        </div>
        
        ${branchesMetadata.length > 0 ? `
        <div class="branch-list">
            ${branchesMetadata.map(branch => {
                let badgeClass = 'feature-branch';
                if (branch.name === 'main') badgeClass = 'main-branch';
                else if (branch.name === 'develop') badgeClass = 'develop-branch';
                
                return `
                <a href="./${branch.path}/" class="branch-card">
                    <div class="branch-header">
                        <h3 class="branch-name">${branch.name}</h3>
                        <span class="branch-badge ${badgeClass}">${branch.name === 'main' ? 'production' : branch.name === 'develop' ? 'staging' : 'feature'}</span>
                    </div>
                    <div class="branch-meta">
                        <div class="meta-item">
                            <span class="meta-label">Last Updated</span>
                            <span class="meta-value">${new Date(branch.lastModified).toLocaleDateString()}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Build Size</span>
                            <span class="meta-value">${branch.size}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Status</span>
                            <span class="meta-value">Ready</span>
                        </div>
                    </div>
                </a>
                `;
            }).join('')}
        </div>
        ` : `
        <div class="no-branches">
            <h3>No Deployments Available</h3>
            <p>Branch builds will appear here once they are deployed.</p>
        </div>
        `}
        
        <div class="footer">
            <p>
                Built with ❤️ using Vite • 
                <a href="https://github.com/clickstefan/flow-buster" target="_blank">View Source</a> • 
                Last generated: ${new Date().toLocaleString()}
            </p>
        </div>
    </div>
</body>
</html>`;
  
  return html;
}

// CLI usage
if (require.main === module) {
  const deployDir = process.argv[2] || './dist';
  const outputFile = process.argv[3] || path.join(deployDir, 'index.html');
  
  console.log('Generating branch index...');
  console.log('Deploy directory:', deployDir);
  console.log('Output file:', outputFile);
  
  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  
  const html = generateBranchIndex(deployDir);
  fs.writeFileSync(outputFile, html, 'utf8');
  
  console.log('✅ Branch index generated successfully!');
}

module.exports = { generateBranchIndex, formatBytes, getDirectorySize };