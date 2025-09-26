# Development Guide for LLMs and Contributors

## 🔧 Required Steps Before Any Commit

**⚠️ CRITICAL: All code changes MUST pass these checks before committing:**

### Quick Start - Pre-Commit Pipeline
```bash
# Install dependencies (first time only)
make install

# Run complete CI pipeline (REQUIRED before every commit)
make ci
```

The `make ci` command runs the exact same pipeline as our GitHub Actions CI, ensuring your changes will pass automated testing.

### What `make ci` Does
1. **TypeScript Type Checking** - Ensures type safety
2. **ESLint Code Analysis** - Checks code quality and standards  
3. **Jest Unit Tests** - Validates functionality
4. **Production Build** - Confirms the app builds successfully

---

## 🚀 Development Workflow

### Initial Setup
```bash
# Clone and setup
git clone <repository-url>
cd flow-buster
make install
```

### Daily Development
```bash
# Start development server
make dev

# Before committing ANY changes
make ci

# If CI passes, you're ready to commit
git add .
git commit -m "Your commit message"
```

### Post-Deployment Validation
```bash
# After pushing changes, wait for GitHub Pages deployment
# Then test that deployment links are working
make test-deployment

# This will:
# 1. Check that https://clickstefan.github.io/flow-buster/ loads
# 2. Check that your branch URL loads correctly  
# 3. Validate no JavaScript errors occur
# 4. Confirm all expected page elements are present
```

### Available Commands
```bash
make help              # Show all available commands
make install           # Install dependencies
make dev               # Start development server
make ci                # Run complete CI pipeline (REQUIRED)
make test              # Run unit tests only
make test-deployment   # Test deployment links and check for JS errors
make lint              # Run ESLint only
make type-check        # Run TypeScript checking only
make build             # Build production bundle
make format            # Format code with Prettier
make clean             # Clean all build artifacts
```

---

## 🤖 LLM Development Guidelines

### Before Making Changes
1. **Always run `make ci`** to understand the current state
2. **Check what's broken** - don't fix unrelated issues unless specifically asked
3. **Test incrementally** - run `make ci` after each logical change

### Code Changes Process
1. **Make minimal changes** - only modify what's necessary
2. **Test frequently**: 
   ```bash
   make type-check  # Quick TypeScript check
   make test        # Quick test run
   make ci          # Full pipeline
   ```
3. **Fix issues immediately** - don't leave broken tests
4. **Commit only when `make ci` passes completely**

### Pre-Commit Hook
The repository has a pre-commit hook that automatically runs `make ci`. If it fails, the commit will be rejected.

**To bypass for emergency commits (NOT recommended):**
```bash
git commit --no-verify -m "Emergency commit message"
```

---

## 🚀 Branch Deployment Testing

### Overview
This project uses automatic branch-based deployment where each branch gets its own URL:
- **Root**: https://clickstefan.github.io/flow-buster/ (branch index)
- **Main**: https://clickstefan.github.io/flow-buster/main/
- **Your Branch**: https://clickstefan.github.io/flow-buster/your-branch-name/

### Testing Deployment
```bash
# Test your current branch deployment
make test-deployment

# Test a specific branch
npm run test:deployment your-branch-name
```

### What the Test Checks
1. **Root Index Page**: Verifies the branch navigation page loads
2. **Branch Deployment**: Confirms your branch-specific URL works
3. **JavaScript Errors**: Detects any console errors or runtime issues
4. **Essential Elements**: Validates required page elements are present

### Workflow Integration
- **Automatic Testing**: CI runs deployment tests after each deployment
- **Failure Handling**: Failed deployment tests will fail the entire workflow
- **Report Generation**: Creates `deployment-test-report.json` with detailed results

### Manual Verification Steps
After pushing changes:
1. **Wait**: Give GitHub Pages 2-3 minutes to update
2. **Test**: Run `make test-deployment` 
3. **Verify**: Check URLs manually if tests fail
4. **Debug**: Review `deployment-test-report.json` for specific issues

### Troubleshooting Failed Deployments
- **404 Errors**: GitHub Pages deployment may not be complete yet
- **JavaScript Errors**: Check browser console for specific error messages
- **Missing Elements**: Verify your build includes all required assets
- **Network Issues**: Temporary connectivity problems may cause false negatives

---

## 🎮 Project Structure

### Key Files to Understand
```
├── src/
│   ├── core/           # Game engine core systems
│   ├── audio/          # Audio processing and beat detection
│   ├── game/           # Game logic managers  
│   └── ui/            # User interface components
├── public/assets/      # Game assets (audio, images, levels)
├── Makefile           # Development commands (THIS IS IMPORTANT)
├── .github/workflows/ # CI/CD pipeline
└── package.json       # Dependencies and npm scripts
```

### Architecture Principles
- **Modular design**: Each manager handles one concern
- **TypeScript strict mode**: All code must pass type checking
- **Test coverage**: Critical systems have unit tests
- **Development-friendly**: Works without external assets

---

## 🐛 Troubleshooting

### CI Pipeline Failures

#### TypeScript Errors
```bash
make type-check  # Run only TypeScript checking
# Fix errors in the files listed
```

#### ESLint Errors  
```bash
make lint        # Run only linting
npm run lint:fix # Auto-fix many issues
```

#### Test Failures
```bash
make test        # Run only tests
npm run test:watch # Run tests in watch mode
```

#### Build Failures
```bash
make build       # Run only build
# Check console output for specific errors
```

### Common Issues

**Dependencies out of sync:**
```bash
make clean && make install
```

**Pre-commit hook not working:**
```bash
chmod +x .husky/pre-commit
```

**TypeScript version warnings:**
```bash
# These are warnings, not errors - safe to ignore
```

---

## 📋 Quality Standards

### Code Quality Requirements
- ✅ **TypeScript**: No compilation errors
- ✅ **ESLint**: No linting errors (warnings allowed)
- ✅ **Tests**: All existing tests must pass
- ✅ **Build**: Production build must succeed
- ✅ **Formatting**: Code should be consistently formatted

### What Makes a Good Commit
1. **Focused changes** - one logical change per commit
2. **Passes all CI checks** - `make ci` returns success
3. **Clear commit message** - describes what and why
4. **No unrelated changes** - don't fix issues you weren't asked to fix
5. **Incremental progress** - commit early and often

---

## 🎯 Success Metrics

### Before Submitting Work
- [ ] `make ci` passes completely without errors
- [ ] Game runs in development mode (`make dev`)
- [ ] Production build works (`make build`)
- [ ] All requested functionality implemented
- [ ] No unrelated code changes
- [ ] Clear documentation of changes made

### Repository Health Indicators
- ✅ CI pipeline badge should be green
- ✅ All pull requests should pass automated checks
- ✅ Development server starts without errors
- ✅ Production builds complete successfully

---

## 🔄 Continuous Integration

### Local CI Replication
The `Makefile` exactly replicates our GitHub Actions workflow:

**Local:** `make ci`
**GitHub Actions:** Same steps, same tools, same results

This ensures that if your local CI passes, the remote CI will also pass.

### Pipeline Steps (Both Local and Remote)
1. Install dependencies with `npm ci`
2. TypeScript type checking with `tsc --noEmit`  
3. ESLint code analysis
4. Jest unit tests
5. Production build with Vite

**The rule is simple: If `make ci` fails, don't commit.**

---

## 💡 Tips for Success

1. **Run `make ci` early and often** - catch issues immediately
2. **Use `make help`** - see all available commands
3. **Read error messages carefully** - they tell you exactly what's wrong
4. **Test in small increments** - don't make many changes before testing
5. **Keep commits focused** - one logical change per commit
6. **Ask for help** - if CI fails and you can't fix it, ask for guidance

This ensures high-quality, maintainable code that works reliably across all environments! 🚀