---
title: "Connect MCP Code to ChatGPT"
description: "Step-by-step setup from starting Local MCP and Secure Tunnel to adding the connector in ChatGPT Web, pairing Mico, and getting your first reply."
order: 1
updatedAt: "2026-11-16"
readingTime: "6 min"
badge: "Setup Guide"
---

This guide walks you through connecting **MCP Code (v0.1.0 beta)** to **ChatGPT Web** so you can send coding tasks from Mico, run them through your ChatGPT session, and review every proposed file edit locally in **Approvals** before it touches disk.

## Before you start

Make sure you have:

- **MCP Code** installed on Windows 11 and open on your machine.
- A project folder added in MCP Code.
- `tunnel-client.exe` available for Secure Tunnel, plus your **Tunnel Runtime API Key**.
- A **ChatGPT** account with access to custom MCP connectors / apps in ChatGPT Web.

---

## Step 1: Install and start Local MCP

MCP Code exposes your local workspace through a built-in Model Context Protocol server running on your machine.

1. Open **MCP Code** and click the **Settings** icon in the left sidebar.
2. Open the **Connections** tab.
3. Locate the **Local MCP** card. By default, MCP Code binds the local server to port `8765` (`http://127.0.0.1:8765/mcp`).
4. If the server is not already active, click **Start Local MCP**.

![MCP Code Settings Connections showing Local MCP](/screenshots/settings-connections.png)
*Settings → Connections with Local MCP status and Secure Tunnel configuration.*

### How to verify success

- The **Local MCP** status badge turns green and reads **Running**.
- The local endpoint `http://127.0.0.1:8765/mcp` is shown without any port error.

---

## Step 2: Configure and start Secure Tunnel

ChatGPT Web runs in the cloud and cannot reach `127.0.0.1` directly. **Secure Tunnel** creates an encrypted HTTPS endpoint that forwards MCP requests to your local server.

1. Still in **Settings → Connections**, expand the **Secure Tunnel** section.
2. Confirm the tunnel client path points to `tunnel-client.exe` and the profile is set to `mcp-code`.
3. Paste your **Tunnel Runtime API Key** into the key field.
4. Click **Check configuration** to validate the binary, profile, and credentials.
5. Click **Start tunnel**.

![MCP Code Secure Tunnel open in Settings Connections](/screenshots/settings-tunnel.png)
*Secure Tunnel panel with Check configuration, Start tunnel, and connection status.*

### How to verify success

- **Check configuration** passes with no missing binary or key warnings.
- The tunnel status switches to **Connected**.
- A public HTTPS URL ending in `/mcp` appears in the Secure Tunnel card. Copy this URL for the next step.

---

## Step 3: Add MCP Code in ChatGPT Web

1. Open **ChatGPT** in your browser and go to **Settings → Connectors** (or **Apps & Connectors**, depending on your ChatGPT plan).
2. Click **Create** (or **Add custom connector**).
3. Enter a name such as `MCP Code`.
4. Paste the **HTTPS `/mcp` URL** from **Secure Tunnel** into the **MCP Server URL** field.
5. Save the connector and complete the authorization prompt if ChatGPT asks to connect.

### How to verify success

- `MCP Code` appears in your active connectors list in ChatGPT without a connection error.
- When you start a new chat in ChatGPT, you can enable or mention the **MCP Code** connector.

---

## Step 4: Pair Mico and send your first task

Now link your local **Mico** chat inside MCP Code to the ChatGPT session.

1. Switch to **Chat** in MCP Code and select your project.
2. In the Mico composer bar, make sure the mode toggle is set to **MCP**.
3. Click **Connect ChatGPT** to generate a short **pairing code**.
4. In ChatGPT Web, open the **Connect to Mico** widget (or paste the pairing prompt/code as instructed by the dialog) to bind the session.
5. Return to MCP Code and send a simple task to Mico, for example:
   `Inspect README.md and summarize the project setup.`

![Mico chat workspace in MCP Code](/screenshots/mico-chat.png)
*Mico chat workspace inside MCP Code after pairing.*

### How to verify success

- Mico's connection indicator switches from disconnected to paired/ready.
- Your prompt receives a response directly inside Mico's chat timeline.
- If Mico proposes file edits, they appear in **Approvals** for review rather than writing directly to disk.

![Approvals diff view in MCP Code](/screenshots/approvals-diff.png)
*Reviewing proposed file changes in Approvals before applying them locally.*

---

## Troubleshooting

### Local MCP does not start

- **Check port `8765`**: Another local process may already listen on `8765`. Stop the conflicting process or change the port in **Settings → Connections** and restart Local MCP.
- **Check the sidecar status**: Restart MCP Code if the local backend failed to initialize on launch.

### Secure Tunnel fails to connect

- **Run Check configuration first**: This catches a missing `tunnel-client.exe` path or an empty `Tunnel Runtime API Key`.
- **Re-enter the API key**: Extra spaces or an expired **Tunnel Runtime API Key** will prevent the `mcp-code` profile from authenticating.
- **Firewall or antivirus**: Allow `tunnel-client.exe` to make outbound HTTPS connections.

### Mico shows no reply after sending a prompt

- **Verify the mode toggle**: Ensure the composer pill is set to **MCP** (not **API** unless you intentionally configured a direct API key).
- **Confirm both Local MCP and Secure Tunnel are active**: ChatGPT cannot reach your workspace if either **Local MCP** (`Running`) or **Secure Tunnel** (`Connected`) stopped.
- **Re-pair Mico**: Pairing codes are temporary. Click **Connect ChatGPT** again to generate a fresh code and re-bind the **Connect to Mico** widget in ChatGPT.
