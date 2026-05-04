# 🔍 WebMonitor — Uptime & Performance Intelligence Agent

![Status](https://img.shields.io/badge/Status-Live-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

**WebMonitor** is a lightweight, real-time uptime monitoring agent built 
to keep production websites under continuous surveillance. 
Designed as a value-added service layer for web development clients, 
it checks site availability every 5 minutes, tracks performance 
metrics, and delivers automated monthly health reports.

> **Live Dashboard:** [v0-web-monitor.vercel.app](https://v0-web-monitor.vercel.app)

---

## ⚙️ Core Features

- **Uptime Monitoring:** Automated HTTP checks every 5 minutes 
  against registered target URLs.
- **Performance Metrics:** Response time tracking and availability 
  percentage per monitored site.
- **Monthly Reports:** Automated generation of uptime and 
  performance summaries for client delivery.
- **Telegram Alerts** *(in development):* Instant push notification 
  to a Telegram channel when a monitored site goes down.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend / Dashboard | Next.js 15 (App Router) |
| Deployment | Vercel |
| Monitoring Logic | Scheduled serverless functions |
| Alerting *(upcoming)* | Telegram Bot API |

---

## 💼 Business Context

WebMonitor was built to support a **recurring revenue model** for 
freelance web development clients. Instead of one-time project 
fees, this agent enables a monthly maintenance and monitoring 
retainer — delivering measurable, ongoing value:

- ✅ 24/7 uptime visibility without manual intervention
- ✅ Immediate incident awareness via Telegram
- ✅ Monthly performance reports as client deliverables
- ✅ Foundation for SLA-backed service agreements

---

## 🗺️ Roadmap

- [x] 5-minute uptime checks
- [x] Performance metric collection
- [x] Monthly automated reports
- [ ] Telegram alert integration on downtime detection
- [ ] Multi-channel alerting (email, Slack)
- [ ] Public status page per monitored site
- [ ] SLA dashboard for client-facing reporting

---

## 🔒 License

Proprietary. Built and maintained by 
[malcom.builder](https://github.com/malcom-builder).
