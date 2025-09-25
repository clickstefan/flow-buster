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
});