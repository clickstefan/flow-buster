# Branch-Based Deployment

This project implements automatic branch-based deployment where each branch gets its own subfolder on GitHub Pages.

## How it Works

- **Main branch** → deployed to `/main/`
- **Feature branches** → deployed to `/feature-name/` (e.g., `/feature/new-ui/`)
- **Pull requests** → deployed to `/pr-branch-name/`

## Configuration

### Vite Configuration (`vite.config.ts`)
- Dynamically sets the `base` path based on the `BRANCH_NAME` environment variable
- Uses `/${branch}/` for production builds
- Falls back to `./` for development

### GitHub Actions (`.github/workflows/build-and-deploy.yml`)
- Triggers on all branch pushes and pull requests
- Extracts the branch name and sets it as `BRANCH_NAME` environment variable
- Builds with the correct base path for each branch
- Deploys to GitHub Pages in branch-specific subfolders
- Uses `keep_files: true` to preserve other branch deployments

## Benefits

1. **Branch previews**: Every branch gets its own URL for testing
2. **PR reviews**: Pull request builds can be previewed before merging
3. **Parallel development**: Multiple features can be deployed simultaneously
4. **No conflicts**: Each branch has its isolated deployment space

## URLs Structure

- Main: `https://username.github.io/repo-name/main/`
- Develop: `https://username.github.io/repo-name/develop/`
- Feature: `https://username.github.io/repo-name/feature/feature-name/`
- Hotfix: `https://username.github.io/repo-name/hotfix/fix-name/`

## Local Testing

Run `./test-deployment.sh` to test the branch deployment logic locally.