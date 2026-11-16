---
title: "MCP Code v0.1.0 Beta: Local-First AI Coding with Approval-Gated Edits"
summary: "Introducing the first beta release of MCP Code (v0.1.0) for Windows 11, featuring Mico, Local MCP, Secure Tunnel for ChatGPT Web, and diff-based Approvals."
date: "2026-11-16"
version: "0.1.0"
tag: "Beta Release"
---

We are opening the first beta of **MCP Code (`v0.1.0`)** for Windows 11.

MCP Code is built around a simple rule: **AI clients can inspect your workspace and propose edits, but nothing writes to your disk until you approve it.**

## What is included in v0.1.0 Beta

### Mico chat workspace (`MCP` and `API` modes)
Work directly inside your project folders with **Mico**. Switch between **MCP** mode (paired with ChatGPT Web via your local server and tunnel) and **API** mode depending on how you want to run tasks.

### Applied changes card in chat history
Whenever you approve proposed edits, Mico records the exact files and line deltas (`+` / `-`) directly beneath that message in chat history. Those records persist across app restarts so you always know which response changed which files.

### Approvals diff review
Every proposed file modification lands in **Approvals** first. Inspect line-by-line diffs, approve only the files you want, or reject proposals cleanly without touching your working tree.

### Local MCP & Secure Tunnel
- **Local MCP** runs on `127.0.0.1:8765/mcp` out of the box from **Settings → Connections**.
- **Secure Tunnel** integrates `tunnel-client.exe` (`mcp-code` profile) with built-in configuration checks so you can connect ChatGPT Web without managing manual port forwarding.

### Aurora UI in Dark and Light themes
A focused desktop workspace built with Tauri, designed to keep chat, diffs, and connection health readable without clutter.

## Getting started

1. Download the latest Windows build from [GitHub Releases](https://github.com/Axz-o/MCPCode/releases/latest).
2. Follow the [Connect MCP Code to ChatGPT](/guides/connect-chatgpt/) guide to start **Local MCP**, connect **Secure Tunnel**, and pair **Mico**.
