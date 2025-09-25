/**
 * Tests for deployment scripts
 */

const fs = require('fs');
const path = require('path');
const { generateBranchIndex, formatBytes, getDirectorySize } = require('../../scripts/generate-branch-index');
const { copyDirectory } = require('../../scripts/prepare-deployment');

describe('Deployment Scripts', () => {
  const testDir = path.join(__dirname, 'test-temp');
  
  // Suppress expected console warnings during tests
  let consoleSpy;
  
  beforeAll(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create test directory structure
    fs.mkdirSync(testDir, { recursive: true });
    
    // Create mock dist directory
    const mockDistDir = path.join(testDir, 'dist');
    fs.mkdirSync(mockDistDir, { recursive: true });
    fs.writeFileSync(path.join(mockDistDir, 'index.html'), '<html>Test</html>');
    fs.writeFileSync(path.join(mockDistDir, 'test.js'), 'console.log("test");');
  });
  
  afterAll(() => {
    // Restore console methods
    consoleSpy?.mockRestore();
    
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('generateBranchIndex', () => {
    it('should generate valid HTML', () => {
      const html = generateBranchIndex('/non-existent', []);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Flow Buster');
      expect(html).toContain('Branch Deployments');
      // Since current branch gets added automatically, we should have at least one branch
      expect(html.includes('branch-card') || html.includes('No Deployments Available')).toBe(true);
    });
    
    it('should include branch data when provided', () => {
      const branches = [
        {
          name: 'main',
          path: 'main',
          lastModified: new Date(),
          size: '1 MB',
          rawSize: 1024 * 1024
        }
      ];
      
      const html = generateBranchIndex('/test', branches);
      
      expect(html).toContain('main');
      expect(html).toContain('production');
      expect(html).toContain('1 MB');
    });
  });

  describe('copyDirectory', () => {
    it('should copy files correctly', () => {
      const sourceDir = path.join(testDir, 'dist');
      const destDir = path.join(testDir, 'copied');
      
      copyDirectory(sourceDir, destDir);
      
      expect(fs.existsSync(path.join(destDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(destDir, 'test.js'))).toBe(true);
      
      const copiedContent = fs.readFileSync(path.join(destDir, 'index.html'), 'utf8');
      expect(copiedContent).toBe('<html>Test</html>');
    });
  });

  describe('getDirectorySize', () => {
    it('should calculate directory size', () => {
      const sourceDir = path.join(testDir, 'dist');
      const size = getDirectorySize(sourceDir);
      
      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });
    
    it('should handle non-existent directories', () => {
      const size = getDirectorySize('/non-existent-path');
      expect(size).toBe(0);
    });
  });

  describe('GitHub Pages Deployment Structure', () => {
    let deploymentDir;
    
    beforeEach(() => {
      deploymentDir = path.join(testDir, 'gh-pages-test');
      if (fs.existsSync(deploymentDir)) {
        fs.rmSync(deploymentDir, { recursive: true, force: true });
      }
    });

    it('should create proper GitHub Pages structure for branch deployment', () => {
      // Simulate deployment preparation
      const branchName = 'feature-test';
      const branchDir = path.join(deploymentDir, branchName);
      const sourceDir = path.join(testDir, 'dist');
      
      // Create deployment directory and copy files
      fs.mkdirSync(branchDir, { recursive: true });
      copyDirectory(sourceDir, branchDir);
      
      // Create deployment metadata
      const metadata = {
        branch: branchName,
        deployment: branchName,
        commit: 'abc123',
        timestamp: new Date().toISOString(),
        isPR: false,
        prNumber: null
      };
      
      fs.writeFileSync(
        path.join(branchDir, '.deployment-info.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Generate root index
      const rootIndexHtml = generateBranchIndex(deploymentDir, [
        {
          name: branchName,
          path: branchName,
          lastModified: new Date(),
          size: '1 KB',
          rawSize: 1024
        }
      ]);
      
      fs.writeFileSync(path.join(deploymentDir, 'index.html'), rootIndexHtml);
      
      // Verify GitHub Pages structure
      expect(fs.existsSync(path.join(deploymentDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(branchDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(branchDir, '.deployment-info.json'))).toBe(true);
      
      // Verify metadata content
      const savedMetadata = JSON.parse(
        fs.readFileSync(path.join(branchDir, '.deployment-info.json'), 'utf8')
      );
      expect(savedMetadata.branch).toBe(branchName);
      expect(savedMetadata.deployment).toBe(branchName);
      expect(savedMetadata.isPR).toBe(false);
      
      // Verify root index contains branch information
      const rootHtml = fs.readFileSync(path.join(deploymentDir, 'index.html'), 'utf8');
      expect(rootHtml).toContain(branchName);
      expect(rootHtml).toContain('feature');
    });

    it('should create proper GitHub Pages structure for PR deployment', () => {
      // Simulate PR deployment preparation
      const prNumber = '123';
      const deploymentName = `pr-${prNumber}`;
      const prDir = path.join(deploymentDir, deploymentName);
      const sourceDir = path.join(testDir, 'dist');
      
      // Create deployment directory and copy files
      fs.mkdirSync(prDir, { recursive: true });
      copyDirectory(sourceDir, prDir);
      
      // Create PR deployment metadata
      const metadata = {
        branch: 'feature-branch',
        deployment: deploymentName,
        commit: 'def456',
        timestamp: new Date().toISOString(),
        isPR: true,
        prNumber: prNumber
      };
      
      fs.writeFileSync(
        path.join(prDir, '.deployment-info.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      // Generate root index
      const rootIndexHtml = generateBranchIndex(deploymentDir, [
        {
          name: deploymentName,
          path: deploymentName,
          lastModified: new Date(),
          size: '1 KB',
          rawSize: 1024
        }
      ]);
      
      fs.writeFileSync(path.join(deploymentDir, 'index.html'), rootIndexHtml);
      
      // Verify GitHub Pages structure for PR
      expect(fs.existsSync(path.join(deploymentDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(prDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(prDir, '.deployment-info.json'))).toBe(true);
      
      // Verify PR metadata content
      const savedMetadata = JSON.parse(
        fs.readFileSync(path.join(prDir, '.deployment-info.json'), 'utf8')
      );
      expect(savedMetadata.isPR).toBe(true);
      expect(savedMetadata.prNumber).toBe(prNumber);
      expect(savedMetadata.deployment).toBe(deploymentName);
      
      // Verify root index contains PR information
      const rootHtml = fs.readFileSync(path.join(deploymentDir, 'index.html'), 'utf8');
      expect(rootHtml).toContain(deploymentName);
    });

    it('should verify deployment files are GitHub Pages compatible', () => {
      // Create a deployment structure
      const branchDir = path.join(deploymentDir, 'main');
      const sourceDir = path.join(testDir, 'dist');
      
      fs.mkdirSync(branchDir, { recursive: true });
      copyDirectory(sourceDir, branchDir);
      
      // Generate root index
      const rootIndexHtml = generateBranchIndex(deploymentDir);
      fs.writeFileSync(path.join(deploymentDir, 'index.html'), rootIndexHtml);
      
      // Verify all files are properly accessible for GitHub Pages
      expect(fs.existsSync(path.join(deploymentDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(branchDir, 'index.html'))).toBe(true);
      
      // Verify root index is valid HTML
      const rootHtml = fs.readFileSync(path.join(deploymentDir, 'index.html'), 'utf8');
      expect(rootHtml).toMatch(/^<!DOCTYPE html>/);
      expect(rootHtml).toContain('<html');
      expect(rootHtml).toContain('</html>');
      
      // Verify branch deployment is valid HTML
      const branchHtml = fs.readFileSync(path.join(branchDir, 'index.html'), 'utf8');
      expect(branchHtml).toContain('<html>Test</html>');
    });

    it('should verify multi-branch deployment structure', () => {
      // Create multiple branch deployments
      const branches = ['main', 'develop', 'feature-test'];
      const sourceDir = path.join(testDir, 'dist');
      
      branches.forEach(branch => {
        const branchDir = path.join(deploymentDir, branch);
        fs.mkdirSync(branchDir, { recursive: true });
        copyDirectory(sourceDir, branchDir);
        
        // Add branch-specific metadata
        const metadata = {
          branch,
          deployment: branch,
          commit: `${branch}-commit`,
          timestamp: new Date().toISOString(),
          isPR: false,
          prNumber: null
        };
        
        fs.writeFileSync(
          path.join(branchDir, '.deployment-info.json'),
          JSON.stringify(metadata, null, 2)
        );
      });
      
      // Generate root index with all branches
      const branchMetadata = branches.map(branch => ({
        name: branch,
        path: branch,
        lastModified: new Date(),
        size: '1 KB',
        rawSize: 1024
      }));
      
      const rootIndexHtml = generateBranchIndex(deploymentDir, branchMetadata);
      fs.writeFileSync(path.join(deploymentDir, 'index.html'), rootIndexHtml);
      
      // Verify all branches are deployed correctly
      branches.forEach(branch => {
        const branchDir = path.join(deploymentDir, branch);
        expect(fs.existsSync(path.join(branchDir, 'index.html'))).toBe(true);
        expect(fs.existsSync(path.join(branchDir, '.deployment-info.json'))).toBe(true);
        
        const metadata = JSON.parse(
          fs.readFileSync(path.join(branchDir, '.deployment-info.json'), 'utf8')
        );
        expect(metadata.branch).toBe(branch);
      });
      
      // Verify root index lists all branches
      const rootHtml = fs.readFileSync(path.join(deploymentDir, 'index.html'), 'utf8');
      branches.forEach(branch => {
        expect(rootHtml).toContain(branch);
      });
      
      // Verify proper branch type badges
      expect(rootHtml).toContain('production'); // for main
      expect(rootHtml).toContain('staging');    // for develop
      expect(rootHtml).toContain('feature');    // for feature-test
    });
  });
});