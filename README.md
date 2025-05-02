# 🌐 WatanHub

**Empowering Students with Mentorship, Community, and Resources**

WatanHub is a full-stack web application designed to connect students with mentors, provide educational resources, and streamline communication through announcements and blog content.

---

## 🚀 Live Demo

🔗 https://watanhub.vercel.app

---

## ✨ Features

### 🧭 General

- Beautiful responsive landing page
- Smooth UI transitions
- Timeline-based About section

### 👤 Authentication

- Supabase login/signup
- Protected & admin-only routes
- -----> Next Sprint : Google Auth

### 👨‍🏫 Mentorship

- Mentor application & review system
- Admin assignment of students to mentors

### 🧠 Blog System

- Public blog viewing
- Admin-controlled CRUD for blogs

### 📢 Admin Dashboard

- View/manage blog analytics
- Send announcements

---

## 📸 Screenshots

#### 🔐 Admin Dashboard – Mentors & Assignments

![Admin Mentors](./client/public/screenshots/Admin1.png)

#### 📄 Admin – No Pending Applications

![Admin ](./client/public/screenshots/Admin2.png)

#### 🧠 Manage Blogs

![Admin](./client/public/screenshots/Admin2.png)

#### 📝 Create Blog Form

![Admin](./client/public/screenshots/Admin3.png)

#### 🏠 Homepage

![Home Page](./client/public/screenshots/home.png)

---

## 🧭 Application Flow

```text
1. Visitors land on homepage → see latest blogs and intro to the mission.
2. Users can:
   - Read blogs
   - View mentors and apply to be one
   - Reach out via contact
3. Admins can:
   - Approve mentors
   - Assign students
   - Create, update, and delete blogs
   - Send announcements
4. Authenticated users can access profile/dashboard.
```

---

## 🛠️ Tech Stack

| Frontend        | Backend           | Services          | Tooling      |
| --------------- | ----------------- | ----------------- | ------------ |
| React + JSX     | Node.js (Express) | Supabase          | dotenv, cors |
| React Router    | REST API          | Google Sheets API | Tailwind CSS |
| Sonner (toasts) |                   | Vercel Analytics  |              |

                                        Resend API(For contactForm)

---

## ⚙️ Setup & Development

### 1. Install Dependencies

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Run Locally

```bash
# Client
cd client
npm start

# Server
cd ../server
node server.js
```

---
