# Contributing to YoPix

> 👋 Hey there! Quick heads up: YoPix was built by a dad with zero development experience, paired with AI (Claude) to create a tool I wished existed for my Yoto Player adventures. The code might be messy, probably breaks a bunch of best practices, and could make seasoned developers cry - but hey, it works! 😅
>
> This project stands on the shoulders of giants, using amazing open-source tools like Pixel It, Next.js, and others. Please support these original projects and their creators. YoPix is not meant for profit - it's just a fun tool for the community.
>
> Also important to note: This project has no affiliation with Yoto or Yoto Player. I'm just a dad who wanted an easier way to make pixel art for my kids' cards.

Thank you for your interest in contributing to YoPix! We welcome contributions from the community and are excited to have you help make YoPix even better. This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Questions and Discussion](#questions-and-discussion)

## Code of Conduct

This project and everyone participating in it are governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/yopix.git
   cd yopix
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. Set up your environment variables following the README.md instructions

## Development Process

1. Make your changes in your feature branch
2. Write or update tests as needed
3. Ensure your code follows the project's coding standards
4. Run tests and ensure they pass:
   ```bash
   npm run test
   # or
   yarn test
   ```
5. Update documentation as needed
6. Commit your changes using clear commit messages

### Commit Message Format

We follow conventional commits for our commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(editor): add eyedropper tool for color selection

Implements an eyedropper tool that allows users to pick colors
directly from the image being edited.
```

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Ensure all tests pass and the build succeeds
3. Update documentation as needed
4. Submit a pull request to the `main` branch
5. The PR title should follow the same convention as commit messages
6. Include a description of the changes and any relevant issue numbers
7. Wait for review from maintainers

### Pull Request Checklist

- [ ] Code follows project coding standards
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main
- [ ] No unnecessary files included

## Coding Standards

### JavaScript/React

- Use ES6+ features
- Follow React Hooks best practices
- Use functional components
- Use TypeScript for type safety
- Follow the project's ESLint configuration

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing and sizing

### Testing

- Write unit tests for new features
- Update existing tests when modifying features
- Aim for good test coverage

## Reporting Bugs

When reporting bugs, please include:

1. Description of the bug
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots if applicable
6. Browser and OS information
7. Any relevant error messages

Use the GitHub Issues template for bug reports.

## Feature Requests

Feature requests are welcome! Please provide:

1. Clear description of the feature
2. Use cases and benefits
3. Any potential implementation details
4. Mock-ups or examples if applicable

Use the GitHub Issues template for feature requests.

## Questions and Discussion

For questions and discussions:

1. Check existing issues and discussions first
2. Use GitHub Discussions for general questions
3. Use GitHub Issues for specific problems
4. Be clear and provide context

## License

By contributing to YoPix, you agree that your contributions will be licensed under the same MIT License that covers the project. 