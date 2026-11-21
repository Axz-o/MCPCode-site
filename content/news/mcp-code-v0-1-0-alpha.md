---
title: "MCP Code v0.1.0 Alpha: Local Projects, Explicit Approvals"
summary: "The first Windows 11 alpha of MCP Code introduces Mico, Local MCP, Secure Tunnel connectivity, diff approvals and a persistent record of applied changes."
date: "2026-11-17"
version: "0.1.0-alpha"
tag: "Alpha Release"
---

**MCP Code v0.1.0 Alpha** is the first Windows 11 release of the local AI coding workspace.

The release starts with one rule: **an AI client may inspect your permitted workspace and propose edits, but no proposed file change is written until you approve it.**

## Included in v0.1.0 Alpha

### Mico chat workspace

Work inside a selected local project with **Mico**. MCP mode connects a supported external client through Local MCP and Secure Tunnel. API mode remains available for configured providers.

### Diff approvals before file writes

Every proposed file modification enters **Approvals** first. Review the diff, approve the files you want, or reject the proposal without changing the project on disk.

### Applied changes in conversation history

After approval, Mico records the affected files and line counts beneath the relevant response. These records remain available after restarting the application.

### Local MCP and Secure Tunnel

- Local MCP runs at `127.0.0.1:8765/mcp` from **Settings → Connections**.
- Secure Tunnel includes configuration checks for connecting a supported external client to the local MCP endpoint.
- Project permissions continue to limit which local folders and operations are available.

### Aurora interface

The Alpha ships with the Aurora desktop workspace, dark and light appearance modes, project selection, connection state and approval controls in one compact Tauri application.

## Install the Alpha

1. Open [GitHub Releases](https://github.com/Axz-o/MCPCode/releases/tag/v0.1.0-alpha) and choose the Windows installer available to your account.
2. Follow [Connect MCP Code to ChatGPT](/guides/connect-chatgpt/) to start Local MCP, configure Secure Tunnel and pair Mico.

This is an early Alpha. Release notes describe implemented behavior; unavailable integrations remain disabled in the application.
