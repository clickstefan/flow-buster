/**
 * Integration tests for GitHub Pages deployment
 * These tests verify that the build process creates the correct structure
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

describe('GitHub Pages Deployment Integration', () => {
  const testTimeout = 60000; // 60 seconds for build operations
  
  beforeAll(() => {
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  describe('Build Process', () => {
    it('should create a valid production build', async () => {
      const { stdout } = await execAsync('npm run build', { 
        cwd: path.resolve(__dirname, '../..'),
        timeout: testTimeout 
      });
      
      // Verify build completed successfully
      expect(stdout).toContain('built in');
      
      // Verify dist directory exists and has correct structure
      const distPath = path.resolve(__dirname, '../../dist');
      expect(fs.existsSync(distPath)).toBe(true);
      expect(fs.existsSync(path.join(distPath, 'index.html'))).toBe(true);
      
      // Verify index.html is valid
      const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
      expect(indexHtml).toMatch(/^<!DOCTYPE html>/);
      expect(indexHtml).toContain('<title>');
      expect(indexHtml).toContain('</html>');
      
      // Verify assets are generated
      const assetsPath = path.join(distPath, 'assets');
      expect(fs.existsSync(assetsPath)).toBe(true);
      
      const assetFiles = fs.readdirSync(assetsPath);
      expect(assetFiles.some(file => file.endsWith('.js'))).toBe(true);
      
    }, testTimeout);

    it('should prepare deployment structure correctly', async () => {
      // First ensure we have a build
      await execAsync('npm run build', { 
        cwd: path.resolve(__dirname, '../..'),
        timeout: testTimeout 
      });
      
      // Run deployment preparation
      await execAsync('npm run deploy:prepare', { 
        cwd: path.resolve(__dirname, '../..'),
        timeout: testTimeout 
      });
      
      // Verify gh-pages structure is created
      const ghPagesPath = path.resolve(__dirname, '../../gh-pages');
      expect(fs.existsSync(ghPagesPath)).toBe(true);
      
      // Verify root index.html exists
      const rootIndexPath = path.join(ghPagesPath, 'index.html');
      expect(fs.existsSync(rootIndexPath)).toBe(true);
      
      // Verify root index is the branch index page
      const rootIndexHtml = fs.readFileSync(rootIndexPath, 'utf8');
      expect(rootIndexHtml).toContain('Flow Buster');
      expect(rootIndexHtml).toContain('Branch Deployments');
      expect(rootIndexHtml).toContain('branch-card');
      
      // Verify branch-specific directory exists
      const findAllDirs = (dir, result = []) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
          if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name);
            result.push(fullPath);
            findAllDirs(fullPath, result); // Recursively find nested directories
          }
        });
        return result;
      };
      
      const allDirs = findAllDirs(ghPagesPath);
      const branchDirsWithIndex = allDirs.filter(dir => 
        fs.existsSync(path.join(dir, 'index.html')) && 
        dir !== ghPagesPath // Exclude root
      );
      
      expect(branchDirsWithIndex.length).toBeGreaterThan(0);
      
      // Verify at least one branch directory has correct structure
      const firstBranchDir = branchDirsWithIndex[0];
      expect(fs.existsSync(path.join(firstBranchDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(firstBranchDir, '.deployment-info.json'))).toBe(true);
      
      // Verify deployment metadata
      const metadataPath = path.join(firstBranchDir, '.deployment-info.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      expect(metadata).toHaveProperty('branch');
      expect(metadata).toHaveProperty('deployment');
      expect(metadata).toHaveProperty('timestamp');
      expect(typeof metadata.isPR).toBe('boolean');
      
    }, testTimeout);

    it('should verify GitHub Pages deployment requirements', async () => {
      // Ensure deployment is prepared
      await execAsync('npm run deploy:local', { 
        cwd: path.resolve(__dirname, '../..'),
        timeout: testTimeout 
      });
      
      const ghPagesPath = path.resolve(__dirname, '../../gh-pages');
      
      // Check GitHub Pages specific requirements
      expect(fs.existsSync(ghPagesPath)).toBe(true);
      
      // Verify no .git directory in deployment (would cause conflicts)
      expect(fs.existsSync(path.join(ghPagesPath, '.git'))).toBe(false);
      
      // Verify root index.html exists (required by GitHub Pages)
      const rootIndexPath = path.join(ghPagesPath, 'index.html');
      expect(fs.existsSync(rootIndexPath)).toBe(true);
      
      // Verify root index is accessible and valid
      const rootIndexHtml = fs.readFileSync(rootIndexPath, 'utf8');
      expect(rootIndexHtml).toMatch(/^<!DOCTYPE html>/i);
      expect(rootIndexHtml).toContain('<meta charset="UTF-8">');
      expect(rootIndexHtml).toContain('<meta name="viewport"');
      
      // Verify branch deployments are accessible
      const findAllDirs = (dir, result = []) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
          if (entry.isDirectory()) {
            const fullPath = path.join(dir, entry.name);
            result.push(fullPath);
            findAllDirs(fullPath, result); // Recursively find nested directories
          }
        });
        return result;
      };
      
      const allDirs = findAllDirs(ghPagesPath);
      const branchDirsWithIndex = allDirs.filter(dir => 
        fs.existsSync(path.join(dir, 'index.html')) && 
        dir !== ghPagesPath // Exclude root
      );
      
      branchDirsWithIndex.forEach(branchPath => {
        const branchIndexPath = path.join(branchPath, 'index.html');
        
        expect(fs.existsSync(branchIndexPath)).toBe(true);
        
        const branchIndexHtml = fs.readFileSync(branchIndexPath, 'utf8');
        expect(branchIndexHtml).toContain('<!DOCTYPE html>');
        
        // Verify assets are properly linked (relative paths for GitHub Pages)
        if (branchIndexHtml.includes('href="') || branchIndexHtml.includes('src="')) {
          // Assets should use relative paths or absolute paths starting with /
          const hasInvalidPaths = branchIndexHtml.match(/(?:href|src)="(?!https?:\/\/|\/|\.)/);
          expect(hasInvalidPaths).toBeNull();
        }
      });
      
      // Verify branch links in root index work correctly (at least one should exist)
      const hasValidLinks = branchDirsWithIndex.some(branchPath => {
        const relativePath = path.relative(ghPagesPath, branchPath);
        return rootIndexHtml.includes(`href="./${relativePath}/"`);
      });
      expect(hasValidLinks).toBe(true);
      
    }, testTimeout);
  });

  describe('Deployment Workflow Verification', () => {
    it('should validate GitHub Actions workflow configuration', () => {
      const workflowPath = path.resolve(__dirname, '../../.github/workflows/build-and-deploy.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
      
      const workflowContent = fs.readFileSync(workflowPath, 'utf8');
      
      // Verify key deployment configurations
      expect(workflowContent).toContain('peaceiris/actions-gh-pages@v3');
      expect(workflowContent).toContain('publish_dir: ./gh-pages');
      expect(workflowContent).toContain('keep_files: true');
      
      // Verify multi-branch deployment triggers
      expect(workflowContent).toContain('github.event_name == \'push\' || github.event_name == \'pull_request\'');
      
      // Verify deployment preparation script is called
      expect(workflowContent).toContain('node scripts/prepare-deployment.js');
      
      // Verify proper permissions for GitHub Pages
      expect(workflowContent).toContain('pages: write');
      expect(workflowContent).toContain('id-token: write');
    });

    it('should validate deployment scripts exist and are executable', () => {
      const scriptsDir = path.resolve(__dirname, '../../scripts');
      expect(fs.existsSync(scriptsDir)).toBe(true);
      
      const generateIndexScript = path.join(scriptsDir, 'generate-branch-index.js');
      const prepareDeployScript = path.join(scriptsDir, 'prepare-deployment.js');
      
      expect(fs.existsSync(generateIndexScript)).toBe(true);
      expect(fs.existsSync(prepareDeployScript)).toBe(true);
      
      // Verify scripts are properly structured
      const generateIndexContent = fs.readFileSync(generateIndexScript, 'utf8');
      const prepareDeployContent = fs.readFileSync(prepareDeployScript, 'utf8');
      
      expect(generateIndexContent).toContain('generateBranchIndex');
      expect(prepareDeployContent).toContain('prepareBranchDeployment');
      
      // Verify scripts have CLI usage
      expect(generateIndexContent).toContain('require.main === module');
      expect(prepareDeployContent).toContain('require.main === module');
    });

    it('should validate npm scripts for deployment', () => {
      const packagePath = path.resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('deploy:prepare');
      expect(packageJson.scripts).toHaveProperty('deploy:index');
      expect(packageJson.scripts).toHaveProperty('deploy:local');
      
      expect(packageJson.scripts['deploy:prepare']).toBe('node scripts/prepare-deployment.js');
      expect(packageJson.scripts['deploy:index']).toBe('node scripts/generate-branch-index.js');
      expect(packageJson.scripts['deploy:local']).toBe('npm run build && npm run deploy:prepare');
    });
  });
});