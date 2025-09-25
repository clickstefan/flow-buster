# Rhythm Runner Game - Makefile
# This file replicates the CI pipeline for local development and pre-commit hooks

.PHONY: help install clean test lint type-check build dev preview format ci pre-commit all

# Default target
all: ci

# Display help information
help:
	@echo "Rhythm Runner Game - Development Commands"
	@echo "========================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make install     - Install all dependencies"
	@echo "  make clean       - Clean node_modules and dist"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev         - Start development server"
	@echo "  make preview     - Preview production build"
	@echo ""
	@echo "Quality Assurance (CI Pipeline):"
	@echo "  make ci          - Run complete CI pipeline (recommended before commits)"
	@echo "  make pre-commit  - Run pre-commit checks (same as ci)"
	@echo "  make type-check  - Run TypeScript type checking"
	@echo "  make lint        - Run ESLint code analysis"
	@echo "  make test        - Run Jest unit tests"
	@echo "  make test-deployment - Test deployment links and check for JS errors"
	@echo "  make build       - Build production bundle"
	@echo "  make format      - Format code with Prettier"
	@echo ""
	@echo "Usage Examples:"
	@echo "  make install     # First time setup"
	@echo "  make ci          # Before committing code"
	@echo "  make dev         # Start development"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm ci
	@echo "✅ Dependencies installed successfully!"

# Clean build artifacts and dependencies
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf node_modules dist .vite
	@echo "✅ Cleanup complete!"

# Run development server
dev:
	@echo "🚀 Starting development server..."
	npm run dev

# Preview production build
preview: build
	@echo "👀 Starting preview server..."
	npm run preview

# TypeScript type checking
type-check:
	@echo "🔍 Running TypeScript type checking..."
	npm run type-check
	@echo "✅ Type checking passed!"

# ESLint code analysis
lint:
	@echo "🔍 Running ESLint analysis..."
	npm run lint
	@echo "✅ Linting completed!"

# Run unit tests
test:
	@echo "🧪 Running unit tests..."
	npm run test
	@echo "✅ All tests passed!"

# Test deployment links and JavaScript errors
test-deployment:
	@echo "🔗 Testing deployment links..."
	npm run test:deployment
	@echo "✅ Deployment tests completed!"

# Build production bundle
build:
	@echo "🏗️  Building production bundle..."
	npm run build
	@echo "✅ Build completed successfully!"

# Format code with Prettier
format:
	@echo "💅 Formatting code..."
	npm run format
	@echo "✅ Code formatting completed!"

# Complete CI pipeline - matches GitHub Actions workflow
ci:
	@echo "🚀 Running complete CI pipeline..."
	@echo "======================================="
	@echo ""
	@echo "Step 1/4: TypeScript Type Checking"
	@make type-check
	@echo ""
	@echo "Step 2/4: Code Quality Analysis (ESLint)"
	@make lint
	@echo ""
	@echo "Step 3/4: Unit Tests"
	@make test
	@echo ""
	@echo "Step 4/4: Production Build"
	@make build
	@echo ""
	@echo "🎉 CI Pipeline completed successfully!"
	@echo "✅ All checks passed - ready to commit!"

# Alias for CI pipeline (used by pre-commit hooks)
pre-commit: ci
	@echo "✅ Pre-commit checks completed successfully!"

# Quick development setup
setup: install
	@echo "🎮 Rhythm Runner setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "  make dev     # Start development server"
	@echo "  make ci      # Run full test suite"
	@echo ""

# Continuous integration check with better error reporting
ci-verbose:
	@echo "🚀 Running CI pipeline with detailed output..."
	@echo "=============================================="
	@echo ""
	@echo "📋 Checking Node.js version..."
	@node --version
	@npm --version
	@echo ""
	@echo "📋 Project info:"
	@npm run --silent || echo "No scripts available"
	@echo ""
	@make ci

# Health check - verify everything is working
health:
	@echo "🏥 Health check for Rhythm Runner..."
	@echo "===================================="
	@echo ""
	@echo "📋 Node.js version:"
	@node --version
	@echo ""
	@echo "📋 NPM version:"
	@npm --version
	@echo ""
	@echo "📋 Dependencies status:"
	@npm list --depth=0 2>/dev/null || echo "Run 'make install' to install dependencies"
	@echo ""
	@echo "📋 Project structure:"
	@ls -la src/ 2>/dev/null || echo "Source directory not found"
	@echo ""
	@echo "🎯 Run 'make ci' to verify everything is working correctly"