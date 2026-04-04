# README Screenshot Strategy

Date: 2026-04-04

## Current direction

Use two complementary paths:

### 1. Public README screenshots

For the VS Code Extension Details page / Marketplace / internet-connected installs:

- use public GitHub-hosted screenshot URLs
- keep README screenshot sections captioned so failures still look intentional

### 2. Offline in-extension guide

For offline or locked-down environments:

- provide a packaged in-extension visual guide
- do not rely on native Details-page README image rendering for local screenshots

## Why this split exists

The native Extension Details page ultimately renders README content inside a constrained webview with an image CSP that favors public HTTPS/data sources, while the markdown/details rendering path appears to strip or reject the offline/local image forms we tested.

A Mermaid Studio-owned webview is therefore the right place for packaged offline visuals.

## README guidance

The README screenshot section should:

- explain what each screenshot demonstrates
- avoid image-only sections
- include a brief fallback note pointing users to the offline guide
- use public screenshot URLs only when verified live

## Offline guidance

The offline guide should become the canonical visual fallback for users without internet access.
