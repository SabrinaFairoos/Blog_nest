-- =============================================================================
-- Blog_nest Database Schema
-- Compatible with MySQL 5.7+ / 8.0+ & MariaDB (phpMyAdmin / XAMPP / InfinityFree)
-- =============================================================================

-- Create database if not exists (Uncomment if needed on local MySQL)
-- CREATE DATABASE IF NOT EXISTS `blog_nest` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `blog_nest`;

-- -----------------------------------------------------------------------------
-- Table structure for table: `user`
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `blogPost`;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) DEFAULT 'user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table: `blogPost`
-- -----------------------------------------------------------------------------
CREATE TABLE `blogPost` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_blogpost_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Data for Testing
-- Default Password for both users: password123
-- Password Hash: $2y$10$XXlY/D7LpQ6kbXPaaRLUmO04GRC4nbDUrBa7J7shEhireKVWm5ESW
-- -----------------------------------------------------------------------------

INSERT INTO `user` (`id`, `username`, `email`, `password`, `role`, `created_at`) VALUES
(1, 'john_doe', 'john@example.com', '$2y$10$XXlY/D7LpQ6kbXPaaRLUmO04GRC4nbDUrBa7J7shEhireKVWm5ESW', 'author', '2026-08-10 09:00:00'),
(2, 'jane_smith', 'jane@example.com', '$2y$10$XXlY/D7LpQ6kbXPaaRLUmO04GRC4nbDUrBa7J7shEhireKVWm5ESW', 'user', '2026-08-11 10:30:00');

INSERT INTO `blogPost` (`id`, `user_id`, `title`, `content`, `created_at`, `updated_at`) VALUES
(1, 1, 'Getting Started with Modern Web Development', 
'# Welcome to Modern Web Development!\n\nBuilding web applications in 2026 is faster and more exciting than ever. In this post, we explore the essentials of building lightweight, performant web applications using clean vanilla architecture.\n\n## Why Vanilla Stack?\n\n- **No Build Complexity:** Zero compilation, zero dependency rot.\n- **Instant Deployment:** Upload directly to any PHP/MySQL server or static hosting.\n- **Lightning-Fast Performance:** Pure browser-native execution without mega-byte JS bundles.\n\n### Quick Code Sample\n\n```javascript\n// Fetching JSON data simply\nasync function fetchPosts() {\n    const res = await fetch(''/backend/api/posts_list.php'');\n    const data = await res.json();\n    console.log(data);\n}\n```\n\n> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra\n\nStay tuned for upcoming tutorials on RESTful API design!',
'2026-08-12 11:15:00', '2026-08-12 11:15:00'),

(2, 1, 'Mastering Markdown for Technical Writing', 
'# Why Markdown is the Standard for Content\n\nMarkdown allows writers to focus on content without getting bogged down by complicated HTML markup.\n\n## Key Formatting Highlights\n\n1. **Headers & Subheaders** for structured hierarchy.\n2. **Code syntax highlighting** for readability.\n3. **Blockquotes & Lists** for emphasized takeaways.\n\n### Formatting Table Example\n\n| Syntax | Description | Example |\n| :--- | :--- | :--- |\n| `**bold**` | Bold text | **Hello** |\n| `*italic*` | Italic text | *World* |\n| `inline code` | Code snippet | `console.log()` |\n\nHappy blogging!', 
'2026-08-13 14:00:00', '2026-08-13 14:00:00'),

(3, 2, 'PHP & MySQL: Best Practices for Secure Authentication', 
'# Secure Authentication Architecture\n\nSecurity is paramount when developing any user-facing web application. Here are key pillars for building secure authentication in PHP.\n\n## 1. Password Hashing\nNever store passwords in plain text or using outdated algorithms like MD5 or SHA1. Always use `password_hash()` with `PASSWORD_DEFAULT`:\n\n```php\n$hash = password_hash($password, PASSWORD_DEFAULT);\nif (password_verify($password, $hash)) {\n    // Password is valid\n}\n```\n\n## 2. SQL Injection Prevention\nAlways utilize **PDO Prepared Statements**:\n\n```php\n$stmt = $pdo->prepare("SELECT * FROM user WHERE email = :email");\n$stmt->execute([''email'' => $email]);\n$user = $stmt->fetch();\n```\n\n## 3. Server-Side Ownership Checks\nNever rely solely on client-side button hiding. Validate `user_id` on every mutation request!\n', 
'2026-08-14 08:30:00', '2026-08-14 08:30:00'),

(4, 2, 'Designing Clean and Accessible UI with CSS Grid & Flexbox', 
'# Modern Layouts without Bloated Frameworks\n\nModern CSS provides powerful layout engines out of the box. With CSS Grid and Flexbox, creating responsive card layouts is straightforward.\n\n### CSS Grid Example\n\n```css\n.post-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n    gap: 1.5rem;\n}\n```\n\nBy leveraging CSS custom properties (`--color-primary`, `--border-radius`), you can build a unified design system that scales smoothly.', 
'2026-08-14 12:00:00', '2026-08-14 12:00:00');
