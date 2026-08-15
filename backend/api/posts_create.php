<?php
/**
 * Create New Blog Post API Endpoint
 * 
 * Creates a new Markdown blog post authored by the currently logged-in user.
 * 
 * Method: POST
 * Access: Authenticated users only
 * Format: JSON or Form-Data
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(false, 'Method Not Allowed. Use POST to create a post.', null, 405);
}

// Enforce authentication (halts with 401 if unauthenticated)
require_auth();

// Retrieve input data
$input = get_json_input();

$title   = sanitize_input($input['title'] ?? '');
$content = trim($input['content'] ?? '');

// --- Input Validations ---
$errors = [];

if (empty($title)) {
    $errors['title'] = 'Post title is required.';
} elseif (mb_strlen($title) < 3 || mb_strlen($title) > 255) {
    $errors['title'] = 'Post title must be between 3 and 255 characters.';
}

if (empty($content)) {
    $errors['content'] = 'Post content is required.';
} elseif (mb_strlen($content) < 5) {
    $errors['content'] = 'Post content must contain at least 5 characters.';
}

if (!empty($errors)) {
    send_json_response(false, 'Validation failed.', ['errors' => $errors], 400);
}

try {
    $user_id = get_current_user_id();

    $stmt = $pdo->prepare(
        "INSERT INTO blogPost (user_id, title, content, created_at, updated_at) 
         VALUES (:user_id, :title, :content, NOW(), NOW())"
    );

    $stmt->execute([
        'user_id' => $user_id,
        'title'   => $title,
        'content' => $content
    ]);

    $post_id = (int)$pdo->lastInsertId();

    send_json_response(true, 'Blog post created successfully.', [
        'post' => [
            'id'         => $post_id,
            'user_id'    => $user_id,
            'author'     => get_current_username(),
            'title'      => $title,
            'excerpt'    => generate_excerpt($content, 150),
            'content'    => $content,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
            'is_owner'   => true
        ]
    ], 201);

} catch (PDOException $e) {
    send_json_response(false, 'Database error while creating post: ' . $e->getMessage(), null, 500);
}
