<?php
/**
 * Update Existing Blog Post API Endpoint
 * 
 * Modifies an existing blog post. Enforces strict server-side authorization:
 * only the original author of the post is permitted to update it.
 * 
 * Method: POST / PUT
 * Access: Authenticated post owner only
 * Format: JSON or Form-Data
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Accept POST or PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    send_json_response(false, 'Method Not Allowed. Use POST or PUT to update a post.', null, 405);
}

// Enforce authentication (401 if unauthenticated)
require_auth();

// Retrieve input data
$input = get_json_input();

$post_id = isset($input['id']) ? filter_var($input['id'], FILTER_VALIDATE_INT) : (isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null);

if (!$post_id || $post_id <= 0) {
    send_json_response(false, 'Invalid or missing post ID.', null, 400);
}

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

    // Verify post existence (404) and owner authorization (403)
    $existingPost = verify_post_ownership($pdo, $post_id, $user_id);

    // Perform the update
    $stmt = $pdo->prepare(
        "UPDATE blogPost 
         SET title = :title, content = :content, updated_at = NOW() 
         WHERE id = :id"
    );

    $stmt->execute([
        'title'   => $title,
        'content' => $content,
        'id'      => $post_id
    ]);

    // Fetch refreshed post data
    $fetchStmt = $pdo->prepare(
        "SELECT 
            b.id, 
            b.user_id, 
            b.title, 
            b.content, 
            b.created_at, 
            b.updated_at, 
            u.username AS author,
            u.email AS author_email
         FROM blogPost b
         JOIN user u ON b.user_id = u.id
         WHERE b.id = :id
         LIMIT 1"
    );
    $fetchStmt->execute(['id' => $post_id]);
    $updatedPost = $fetchStmt->fetch();

    send_json_response(true, 'Blog post updated successfully.', [
        'post' => [
            'id'           => (int)$updatedPost['id'],
            'user_id'      => (int)$updatedPost['user_id'],
            'author'       => (string)$updatedPost['author'],
            'author_email' => (string)$updatedPost['author_email'],
            'title'        => (string)$updatedPost['title'],
            'excerpt'      => generate_excerpt($updatedPost['content'], 150),
            'content'      => (string)$updatedPost['content'],
            'created_at'   => $updatedPost['created_at'],
            'updated_at'   => $updatedPost['updated_at'],
            'is_owner'     => true
        ]
    ], 200);

} catch (PDOException $e) {
    send_json_response(false, 'Database error while updating post: ' . $e->getMessage(), null, 500);
}
