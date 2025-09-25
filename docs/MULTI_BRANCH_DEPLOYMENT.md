# Multi-Branch Deployment System

This document describes the multi-branch deployment system for Flow Buster, which allows each branch and PR to have its own live deployment.

## Overview

The deployment system creates a branch-aware structure where:

- **Root path (`/`)**: Shows an index of all available branch deployments
- **Branch paths (`/{branch-name}/`)**: Each branch gets its own subdirectory with a full deployment
- **PR paths (`/pr-{number}/`)**: Pull requests get their own temporary deployments

## Features

### 🌟 Branch Index Page
- Clean, responsive UI showing all available deployments
- Build metadata including last updated date and build size
- Direct links to each branch deployment
- Branch type badges (production/staging/feature)

### 🚀 Automated Deployment
- Deploys on every push to any branch
- Deploys for pull requests
- Preserves existing deployments while adding new ones
- Automatic index regeneration

### 📦 Build Organization
- Each deployment is self-contained in its own directory
- Deployment metadata stored with each build
- Build size calculation and display
- No conflicts between different branch deployments

## How It Works

### 1. Build Process
```bash
# Standard build
npm run build

# Build + prepare deployment locally  
npm run deploy:local
```

### 2. Deployment Structure
```
gh-pages/
├── index.html                    # Root index page
├── main/                         # Main branch deployment
│   ├── index.html               # Game files
│   ├── assets/
│   └── .deployment-info.json    # Metadata
├── develop/                      # Develop branch deployment
│   └── ...
├── feature-xyz/                  # Feature branch deployment
│   └── ...
└── pr-123/                       # PR deployment
    └── ...
```

### 3. GitHub Actions Integration
The workflow automatically:
1. Builds the application for any push or PR
2. Runs the deployment preparation script
3. Merges with existing deployments on gh-pages
4. Regenerates the root index with updated metadata
5. Deploys to GitHub Pages with `keep_files: true`

## Scripts

### `scripts/generate-branch-index.js`
- Generates the root index HTML page
- Scans existing deployments and creates cards for each
- Calculates build sizes and formats metadata
- Responsive design with branch type badges

### `scripts/prepare-deployment.js`
- Organizes built files into branch-specific directories
- Copies current build to appropriate subfolder
- Generates deployment metadata
- Calls index generator to update root page

## Development Commands

```bash
# Test deployment preparation locally
npm run deploy:local

# Generate index page only  
npm run deploy:index

# View deployment structure
ls -la gh-pages/
```

## Deployment Workflow

### For Branches
1. Push to any branch triggers deployment
2. Build gets placed in `/{branch-name}/`
3. Root index is updated with new/updated branch info

### For Pull Requests  
1. PR creation/update triggers deployment
2. Build gets placed in `/pr-{number}/`
3. Root index shows PR deployments with special badges

### Branch Cleanup
- Deployments persist until manually removed
- Could be extended with automatic cleanup policies
- Old deployments remain accessible via direct URL

## Benefits

- **Preview all branches**: Easy access to any branch's current state
- **PR reviews**: Reviewers can test live deployments
- **No conflicts**: Each branch is completely isolated
- **Build history**: Multiple deployments can coexist
- **Easy navigation**: Central index makes discovery simple

## Future Enhancements

- Automatic cleanup of old deployments
- Build comparison tools
- Deployment notifications
- Custom deployment URLs
- Build artifact analysis