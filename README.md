# ☕ Blog_nest — Full-Stack Blog Application

A responsive, decoupled, and secure full-stack blogging platform built with **Semantic HTML5**, **Modern Vanilla CSS (Aesthetic Brown & Mocha theme)**, **Modular Vanilla JavaScript (ES6+)**, **PHP 8+ (PDO)**, and **MySQL**.

Designed for assignment deployment, standard LAMP/WAMP/XAMPP environments, and free shared PHP hosting (e.g., InfinityFree, 000webhost).

---

## 🌟 Key Features

1. **Aesthetic UI & Design System:**
   - Curated **Warm Latte Cream** & **Deep Espresso Mocha** color palette.
   - Built-in Theme Switcher (☀️ Light Latte / 🌙 Dark Mocha).
   - Glassmorphic sticky header, hero search with debounce, and category filters.
   - Dynamic reading time estimator and human-friendly date formatters.
   - Reading progress bar and copy-to-clipboard buttons on code blocks.

2. **User Authentication & Authorization:**
   - Secure registration, login, and logout powered by native PHP sessions (`$_SESSION`).
   - One-way password hashing using `password_hash()` and `password_verify()` with `PASSWORD_DEFAULT`.
   - Dynamic navigation bar synchronization based on real-time authentication status (`backend/api/auth_status.php`).

3. **Markdown-Powered Article Management:**
   - Client-side Markdown rendering via `marked.js` with structured typography and syntax highlight styles.
   - Live split-view Markdown editor with toolbar shortcuts (Bold, Italic, Headings, Code, Quotes, Lists, Tables).
   - Word count, character count, and reading time metrics.
   - Dual-mode editor supporting both **Create Mode** and **Edit Mode** (`editor.html?id=123`).

4. **Strict Server-Side Security:**
   - **SQL Injection Prevention:** 100% PDO prepared statements with bound parameters across all endpoints.
   - **Broken Access Control Prevention:** Author ownership validation (`$_SESSION['user_id'] === $post['user_id']`) enforced on every update and delete mutation (`403 Forbidden` if unauthorized).
   - **XSS & Input Sanitization:** Clean input stripping and safe HTML node rendering.

5. **Zero Frontend Build Dependencies:**
   - No Node.js, Webpack, Vite, or npm build steps required. Ready for direct file transfer via FTP.

---

## 🗂️ Project Architecture & Folder Structure

```text
Blog_nest/
├── backend/
│   ├── config/
│   │   └── db.php                  # PDO database connection & error handling
│   ├── includes/
│   │   ├── auth_check.php          # Session validation & ownership verification helper
│   │   └── response_helper.php     # Standardized JSON response & sanitization utilities
│   └── api/
│       ├── register.php            # User registration endpoint (POST)
│       ├── login.php               # User login endpoint (POST)
│       ├── logout.php              # User logout endpoint (POST/GET)
│       ├── auth_status.php         # Check current session & user metadata (GET)
│       ├── posts_list.php          # List blog posts with search/filter & excerpts (GET)
│       ├── posts_read.php          # Fetch single post by ID (GET)
│       ├── posts_create.php        # Create a new blog post (POST, Auth required)
│       ├── posts_update.php        # Update existing post (POST/PUT, Owner only)
│       └── posts_delete.php        # Delete post (POST/DELETE, Owner only)
├── public/
│   ├── index.html                  # Home page / Blog feed & search
│   ├── post.html                   # Single blog post reader view with Markdown
│   ├── editor.html                 # Create & Edit post with live Markdown preview
│   ├── login.html                  # User login page
│   ├── register.html               # User registration page
│   ├── css/
│   │   └── style.css               # Aesthetic brown & mocha design system
│   └── js/
│       ├── auth.js                 # Auth form handling & dynamic navigation state
│       ├── app.js                  # Feed rendering, post reader & delete modal
│       └── editor.js               # Editor logic & live Markdown preview
├── schema.sql                      # Database schema and seed data for phpMyAdmin
├── .env.example                    # Sample database credentials configuration
├── implementation.md               # 4-part modular project execution plan
└── README.md                       # Project documentation & deployment guide
```

---

## 💻 Local Setup Instructions (XAMPP / WAMP / MAMP)

### Step 1: Clone or Place Project in Web Root
1. Copy the `Blog_nest` folder into your web server's document root:
   - **XAMPP:** `C:/xampp/htdocs/Blog_nest`
   - **WAMP:** `C:/wamp64/www/Blog_nest`
   - **MAMP:** `/Applications/MAMP/htdocs/Blog_nest`

### Step 2: Start Apache & MySQL
1. Open the **XAMPP Control Panel** (or WAMP).
2. Click **Start** next to **Apache** and **MySQL**.

### Step 3: Import Database Schema
1. Open your browser and navigate to [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
2. Click on **New** in the left sidebar and create a database named `blog_nest` (with Collation `utf8mb4_unicode_ci`).
3. Select the newly created `blog_nest` database.
4. Click on the **Import** tab at the top.
5. Click **Choose File**, select `Blog_nest/schema.sql`, and click **Import** (or **Go**).
6. Verify that `user` and `blogPost` tables are created with sample seed data.

### Step 4: Verify Database Connection (`backend/config/db.php`)
By default, `backend/config/db.php` is configured for standard local development:
```php
$host     = 'localhost';
$dbname   = 'blog_nest';
$username = 'root';
$password = '';
```
If your local MySQL root user has a password, update `$password` in [backend/config/db.php](file:///c:/Users/ASUS/Desktop/Blog_nest/backend/config/db.php).

### Step 5: Open the Application
Navigate to the frontend in your browser:
- **Home Feed:** [http://localhost/Blog_nest/public/index.html](http://localhost/Blog_nest/public/index.html)

---

## ☁️ Free Shared PHP Hosting Deployment Guide (InfinityFree / 000webhost)

### 1. Create a Free Account
1. Register on [InfinityFree](https://www.infinityfree.com/) (or [000webhost](https://www.000webhost.com/)).
2. Create a new hosting account and note your **FTP Details** and **Control Panel (cPanel)** credentials.

### 2. Create MySQL Database on Hosting
1. Log into your hosting **cPanel / Control Panel**.
2. Navigate to **MySQL Databases**.
3. Create a new database (e.g., `epiz_12345678_blog_nest`).
4. Note your database credentials:
   - **MySQL Hostname:** (e.g., `sql123.infinityfree.com`)
   - **Database Name:** (e.g., `epiz_12345678_blog_nest`)
   - **Database Username:** (e.g., `epiz_12345678`)
   - **Database Password:** (Your account password)

### 3. Import `schema.sql` via Remote phpMyAdmin
1. In your hosting cPanel, click **phpMyAdmin**.
2. Select your newly created remote database.
3. Click **Import**, upload `schema.sql`, and click **Go**.

### 4. Update Database Credentials in `backend/config/db.php`
Open [backend/config/db.php](file:///c:/Users/ASUS/Desktop/Blog_nest/backend/config/db.php) and replace with your remote hosting details:
```php
$host     = 'sql123.infinityfree.com';      // Your remote MySQL host
$dbname   = 'epiz_12345678_blog_nest';      // Your remote DB name
$username = 'epiz_12345678';                // Your remote DB username
$password = 'your_strong_password_here';    // Your remote DB password
```

### 5. Upload Files via FTP (FileZilla)
1. Open **FileZilla** and connect using your hosting FTP host, username, and password.
2. Navigate to the remote directory:
   - InfinityFree: `htdocs/`
   - 000webhost: `public_html/`
3. Upload the contents of `Blog_nest` into `htdocs/` maintaining the folder structure (`backend/` and `public/`).

### 6. Access Live Application
Visit your assigned free domain in your browser:
`http://yourdomain.infinityfreeapp.com/public/index.html`

---

## 🧪 Pre-Configured Test Accounts (Seed Data)

The `schema.sql` file comes with pre-seeded test accounts and Markdown articles:

| Username | Password | Email | Role |
| :--- | :--- | :--- | :--- |
| `alex_dev` | `password123` | `alex@example.com` | `author` |
| `sarah_writer` | `password123` | `sarah@example.com` | `user` |

---

## ✅ Quality Assurance & Verification Checklist

- [x] **Registration:** Create a new user with valid username, email, and password.
- [x] **Login:** Sign in using either username or email and verify that the navbar updates to show user badge and "Write Post" button.
- [x] **Markdown Post Creation:** Click "Write Post", enter title and content with headings/code/quotes, and observe real-time preview and word stats before publishing.
- [x] **Post Reading:** Open single post view and verify Markdown formatting, syntax code blocks, and copy button.
- [x] **Author Security & Ownership:**
  - When logged in as author of a post: "Edit" and "Delete" buttons appear.
  - When logged in as a different user: "Edit" and "Delete" buttons are hidden, and API directly rejects tampering with `403 Forbidden`.
- [x] **Post Editing:** Modify post title/content via `editor.html?id=...` and verify changes save and reflect immediately.
- [x] **Post Deletion:** Click delete -> confirm inside modal -> verify post is removed from feed.
- [x] **Theme Switcher:** Toggle between Warm Latte Cream and Dark Mocha modes.
