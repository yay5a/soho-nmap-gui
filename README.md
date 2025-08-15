# SOHO-Nmap Monitor

A lightweight Next.js (App Router) dashboard for running **safe Nmap scans** on your home network (RFC1918 ranges only).  
Built for **SOHO environments** and **CompTIA A+ / Network+** study—see open ports, services, and hosts at a glance.

---

## Features

- **App Router** + API routes for clean separation of UI and backend
- **LAN-only scanning** enforced server-side
- **Fast or stealth modes** (`-F` vs `-sS`)
- Auto-refresh every 30s for live monitoring
- Zero external DB—runs entirely from `nmap` output
- Works on Fedora / WSL2 / Linux

---

## Prerequisites

- **Nmap** installed with raw socket capabilities:
  ```bash
  sudo dnf install -y nmap libcap
  sudo setcap cap_net_raw,cap_net_admin+eip $(which nmap)
  getcap $(which nmap)   # verify

