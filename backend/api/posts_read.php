<?php
/**
 * Read Single Blog Post API Endpoint
 * 
 * Fetches full details and raw Markdown content of a single blog post by its ID.
 * 
 * Method: GET
 * Access: Public
 * Param: ?id={post_id}
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Method Not Allowed. Use GET to read a post.', null, 405);
}

// Retrieve post ID from query parameters or JSON input
$input = get_json_input();
$post_id = isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : (isset($input['id']) ? filter_var($input['id'], FILTER_VALIDATE_INT) : null);

if (!$post_id || $post_id <= 0) {
    send_json_response(false, 'Invalid or missing post ID. Please provide a valid integer ID.', null, 400);
}

try {
    $stmt = $pdo->prepare(
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

    $stmt->execute(['id' => $post_id]);
    $post = $stmt->fetch();

    if (!$post) {
        send_json_response(false, 'Blog post not found.', null, 404);
    }

    $current_user_id = get_current_user_id();
    $is_owner = is_authenticated() && ((int)$post['user_id'] === $current_user_id);

    $response_data = [
        'id'           => (int)$post['id'],
        'user_id'      => (int)$post['user_id'],
        'author'       => (string)$post['author'],
        'author_email' => (string)$post['author_email'],
        'title'        => (string)$post['title'],
        'content'      => (string)$post['content'],
        'created_at'   => $post['created_at'],
        'updated_at'   => $post['updated_at'],
        'is_owner'     => $is_owner
    ];

    send_json_response(true, 'Post retrieved successfully.', [
        'post' => $response_data
    ], 200);

} catch (PDOException $e) {
    send_json_response(false, 'Database error while reading post: ' . $e->getMessage(), null, 500);
}
