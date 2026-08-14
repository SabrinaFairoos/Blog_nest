# Build Prompt: Blog Application (IN2120 Web Programming)

Copy everything below this line into Antigravity as your build instruction.

---

## Project Goal

Build a full-stack **Blog Application** with the following stack:
- **Frontend:** HTML, CSS, JavaScript (vanilla, no frameworks unless I ask)
- **Backend:** PHP (procedural or simple OOP, no heavy frameworks like Laravel)
- **Database:** MySQL

The app must support user authentication and let logged-in users manage only their own blog posts, while anyone (logged in or not) can read all blog posts.

## Functional Requirements

### 1. User Authentication & Authorization
- Users can **register** (username, email, password), **log in**, and **log out**.
- Passwords must be hashed (use `password_hash()` / `password_verify()` in PHP — never store plain text).
- Use PHP sessions to track logged-in users.
- Only authenticated users can **create, update, or delete** blog posts.
- A user must **only** be able to edit/delete **their own** posts — enforce this server-side by checking `user_id` on every update/delete request, not just hiding buttons in the UI.

### 2. Blog Management
- Create new blog posts via a blog editor. Use a lightweight Markdown editor (e.g. render Markdown to HTML using a small JS library like `marked.js`, or write a minimal custom parser — client-side is fine).
- Read: display all blog posts on the home page (title, short excerpt, author, date).
- Update: logged-in author can edit their own post's title/content.
- Delete: logged-in author can delete their own post (with a confirmation prompt).

### 3. Frontend Pages
- `index.html` / home page — list of all blog posts (newest first), each linking to its single view.
- `post.html` — single blog view page showing full content (rendered from Markdown), author name, and created/updated date.
- `editor.html` — used for both creating a new post and editing an existing one (detect mode via a query param like `?id=123` for edit, no param for create).
- `login.html` and `register.html` — auth forms.
- Clean, responsive CSS (flexbox/grid, mobile-friendly, no inline styles). Keep the design simple and readable — a card-based list on the home page, a readable single-column layout for the post view.

### 4. Backend (PHP) Structure
Suggested folder layout:
```
/backend
  /config
    db.php              -- MySQL connection (PDO recommended)
  /api
    register.php
    login.php
    logout.php
    posts_create.php
    posts_read.php
    posts_update.php
    posts_delete.php
    posts_list.php
  /includes
    auth_check.php       -- helper to verify session + ownership
/public (or root)
  index.html
  post.html
  editor.html
  login.html
  register.html
  /css
    style.css
  /js
    app.js
    editor.js
    auth.js
```
- Use **PDO with prepared statements** for all queries (prevent SQL injection).
- Return JSON responses from API endpoints so the frontend JS can `fetch()` them.
- Validate and sanitize all inputs server-side (don't trust client-side validation alone).
- Set proper HTTP status codes (401 for unauthenticated, 403 for unauthorized/not-owner, 404 for not found, etc).

### 5. Database Schema (MySQL)
Minimum required tables:

```sql
CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blogPost (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```
Also generate a `schema.sql` file with this so I can import it directly via phpMyAdmin on free hosting.

### 6. Non-Functional / Delivery Requirements
- Include a `README.md` explaining: how to set up locally (XAMPP/WAMP steps), how to import the database, and how to deploy to free PHP hosting (e.g. InfinityFree).
- Include a `.env.example` or a clearly marked config section in `db.php` for DB credentials (host, db name, user, password) so I can swap in hosting credentials easily.
- Keep the code beginner-readable with comments — this is for a university assignment, so clarity matters more than cleverness.
- No frontend build tools (no Node/Webpack/React) — this needs to run on basic shared PHP hosting with just static files + PHP.

## What I want you to generate, in order
1. The full folder structure listed above with all files.
2. `schema.sql` with the two tables and a couple of seed rows for testing.
3. `db.php` with a PDO connection using placeholder credentials.
4. All PHP API endpoints with proper auth/ownership checks.
5. All HTML/CSS/JS frontend files, wired to the API via `fetch()`.
6. A `README.md` covering local setup, DB import, and deployment steps to a free host.

After generating the code, give me a short checklist of manual steps I still need to do myself (e.g. creating the free hosting account, uploading files, updating `db.php` with real credentials, testing on the live URL).
