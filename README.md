# ☁️ CloudEnthu

> **Real-world AWS Cloud Practitioner notes, study guides, and learning materials — written week by week.**

A personal blog and notes platform built to document my journey preparing for the **AWS Certified Cloud Practitioner (CLF-C02)** exam. Every concept, command, and gotcha I encounter is organized by week and published here.

🌐 **Live Site:** *Coming Soon*

---

## 📖 About This Project

CloudEnthu is a **full-stack, self-hosted blogging CMS** I built from scratch to share my AWS learning journey. Instead of scattering notes across Notion or random Google Docs, all content lives here — organized by week, tagged by service, and published publicly for anyone preparing for the **AWS Cloud Practitioner** certification.

**What you'll find here:**
- 📝 Week-by-week study notes (IAM, S3, EC2, Lambda, VPC, etc.)
- 🔖 Concept breakdowns in plain English
- 📌 Exam tips and what to know vs. what to skip
- 🛠️ Real-world usage examples and gotchas

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS (Neobrutalism Design) |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | JWT (JSON Web Tokens) + bcrypt |
| **Security** | Helmet.js, express-rate-limit |

---

## 🗂️ Project Structure

```
CloudEnthu/
├── prisma/
│   ├── schema.prisma      # DB models: User, Note, Week
│   └── seed.js            # Initial seed data
├── src/
│   ├── App.jsx            # React Router setup
│   ├── Dashboard.jsx      # Admin CMS dashboard
│   ├── PublicHome.jsx     # Public blog feed (week-grouped)
│   ├── PublicPost.jsx     # Individual post page
│   ├── PublicProfile.jsx  # Author profile page
│   └── index.css          # Global neobrutalism styles
├── server.js              # Express API server
├── .env.sample            # Environment variable template
└── vite.config.js
```

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- PostgreSQL

### 1. Clone the repo
```bash
git clone https://github.com/MaitrikMakwana/CloudEnthu.git
cd CloudEnthu
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.sample .env
```
Edit `.env` and fill in your `DATABASE_URL` and a generated `JWT_SECRET`.

### 4. Setup the database
```bash
npx prisma db push
npx prisma db seed   # Optional: seed with demo data
```

### 5. Run the app

In two separate terminals:
```bash
# Terminal 1 – Frontend
npm run dev

# Terminal 2 – Backend
node server.js
```

The site will be live at **http://localhost:5173**
The API runs at **http://localhost:3001**

---

## ✨ Features

- **📅 Week-based organization** — Notes grouped into weeks with customizable week names
- **🏷️ Tag system** — Filter posts by topic (`#s3`, `#iam`, `#ec2`, etc.)
- **🔒 Secure Admin CMS** — JWT-authenticated dashboard with rate-limiting & helmet
- **📝 Markdown editor** — Write notes in Markdown, rendered for readers
- **🌐 Public blog feed** — Clean, audience-facing site with week dropdown and tag filters
- **🚀 Draft / Publish workflow** — Keep notes private as drafts, publish when ready

---

## 📌 AWS Topics Covered (Growing List)

| Week | Topic |
|------|-------|
| Week 1 | IAM — Users, Roles, Policies, Groups |
| Week 2 | S3 — Storage Classes, Buckets, Lifecycle |
| Week 3 | EC2 — Instance Types, Pricing, Security Groups |
| *...* | *More added weekly* |

---

## 🔐 Security

- All admin API routes require Bearer JWT authentication
- Login endpoint rate-limited to **10 requests / 15 minutes** per IP
- Passwords hashed with `bcrypt` (10 rounds)
- HTTP headers hardened via `helmet.js`
- Database queries protected against SQL injection via Prisma ORM
- `.env` file **never committed** to the repository

---

## 📄 License

MIT — Feel free to fork and adapt for your own study journey.

---

*Built with ☕ while grinding for AWS Cloud Practitioner. — Maitrik Makwana*
