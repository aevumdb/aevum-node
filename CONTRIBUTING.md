# Contributing to AevumDB Node.js Driver

We welcome contributions from everyone! Whether you're fixing a bug, adding a new feature, improving documentation, or providing feedback, your help is valuable. This document outlines the guidelines for contributing to the AevumDB Node.js Driver.

## Code of Conduct

Please note that this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please help us by [reporting an issue on GitHub](https://github.com/aevumdb/aevum-node/issues).
Before submitting a bug report, please:

-   **Check existing issues**: Your bug might have already been reported or fixed.
-   **Provide a minimal reproduction**: Clearly describe the steps to reproduce the issue. Include your environment (Node.js version, OS, driver version), expected vs. actual behavior, and any relevant error messages or logs.
-   **Be specific**: The more details you provide, the easier it is for us to understand and fix the bug.

### Suggesting Enhancements or Features

We love new ideas! If you have a suggestion for an enhancement or a new feature:

-   **Check existing issues/discussions**: Your idea might already be under consideration.
-   **Open a GitHub Discussion**: Share your idea in our [GitHub Discussions](https://github.com/aevumdb/aevum-node/discussions) section to gather feedback from the community and maintainers.
-   **Describe the problem**: Clearly explain the problem your suggestion aims to solve.
-   **Propose a solution**: Describe how your feature or enhancement would work and its benefits.

### Code Contributions

We appreciate code contributions! To contribute code:

1.  **Fork the repository**: Start by forking the `aevumdb/aevum-node` repository to your GitHub account.
2.  **Clone your fork**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/aevum-node.git
    cd aevum-node
    ```
3.  **Install dependencies**:
    ```bash
    pnpm install
    ```
4.  **Create a new branch**:
    ```bash
    git checkout -b feature/your-feature-name-or-bugfix/issue-number
    ```
    Choose a descriptive branch name.
5.  **Make your changes**: Implement your feature or bug fix.
    -   Adhere to the existing code style.
    -   Add relevant tests for your changes.
    -   Update documentation if necessary.
6.  **Run tests**: Ensure your changes don't break anything.
    ```bash
    pnpm test
    ```
7.  **Run lint and format checks**: Ensure code quality.
    ```bash
    pnpm lint:check
    pnpm format:check
    ```
    You can fix issues using `pnpm lint` and `pnpm format`.
8.  **Commit your changes**: Write clear and concise commit messages.
    ```bash
    git commit -m "feat: Add new feature"
    # or
    git commit -m "fix: Resolve bug in X"
    ```
9.  **Push to your fork**:
    ```bash
    git push origin feature/your-feature-name-or-bugfix/issue-number
    ```
10. **Open a Pull Request (PR)**:
    -   Go to the `aevumdb/aevum-node` repository on GitHub and open a new PR from your branch.
    -   Provide a clear title and description for your PR.
    -   Reference any related issues or discussions.
    -   Ensure all checks (tests, linting) pass.

### Documentation Contributions

Improving our documentation is a great way to contribute! If you find an error, typo, or a section that could be clearer, please open a pull request with your changes or report an issue.

## Development Setup

To get a local development environment running:

1.  **Clone the repository**.
2.  **Install pnpm**: If you don't have it, install with `npm install -g pnpm`.
3.  **Install dependencies**: `pnpm install`.
4.  **Build**: `pnpm build` to compile the TypeScript code.
5.  **Run tests**: `pnpm test`.

Thank you for contributing to the AevumDB Node.js Driver!
