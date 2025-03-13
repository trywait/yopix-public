# GitHub Pre-Push Security Checklist

## Before Making Your Repository Public

- [ ] Ensure `.env.local` and any other files with real credentials are in `.gitignore`
- [ ] Check that no real API keys or tokens are hardcoded in your source code
- [ ] Verify that your `.env.local.example` file uses placeholders instead of real values
- [ ] Scan your commit history for any accidentally committed sensitive data
- [ ] Remove any test accounts or default passwords
- [ ] Make sure no internal URLs, IPs, or hostnames are exposed
- [ ] Check for any commented-out code containing sensitive information

## Repository Configuration

- [ ] Add a clear README with setup instructions
- [ ] Consider adding a SECURITY.md file with security policy
- [ ] Set up branch protection rules for main/master branch
- [ ] Configure dependency scanning tools (Dependabot, etc.)

## After Publishing

- [ ] Validate that sensitive files are not accessible in the public repository
- [ ] Consider setting up secret scanning alerts in GitHub
- [ ] Monitor for exposure of new secrets or sensitive data
- [ ] Regularly update dependencies to address security vulnerabilities

Remember: The best practice is to use environment variables for all sensitive configuration and never commit real credentials to your repository. 