# Security Policy

Thanks for helping keep Mermaid Studio safe.

## Supported versions

As an early-stage project, security fixes will generally target the latest published release and the main development branch.

## Reporting a vulnerability

Please **do not** report security issues in a public GitHub issue.

Instead:
1. Use GitHub private vulnerability reporting / security advisories for this repository if available.
2. If that is not available, contact the maintainer privately first.
3. Include clear reproduction details and impact information.

Helpful details include:
- affected Mermaid source or Markdown content
- whether the issue involves preview, export, webviews, builder behavior, or packaged assets
- expected impact (file overwrite, script execution, unsafe rendering, dependency issue, etc.)
- environment details (VS Code version, OS, Mermaid Studio version)

## Scope examples

Security-relevant issues may include:
- unsafe webview behavior
- code/script injection via preview/export paths
- malicious SVG or HTML handling
- unsafe file write behavior
- dependency vulnerabilities with real impact on users

Non-security bugs such as normal rendering glitches, formatting issues, or incorrect highlighting should go through the standard bug-report process instead.

## Response goals

The project will aim to:
- acknowledge a credible report promptly
- assess severity and reproduction
- coordinate a fix before public disclosure when appropriate

Thanks again for reporting responsibly.
