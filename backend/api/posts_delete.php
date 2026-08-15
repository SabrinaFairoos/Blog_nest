<?php
/**
 * Delete Blog Post API Endpoint
 * 
 * Permanently removes a blog post from the database.
 * Enforces strict server-side authorization: only the author of the post can delete it.
 * 
 * Method: POST / DELETE / GET
 * Access: Authenticated post owner only
 * Format: JSON, Form-Data, or Query String
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Allow POST, DELETE, and GET methods
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Method Not Allowed. Use POST, DELETE, or GET to delete a post.', null, 405);
}

// Enforce authentication (401 if unauthenticated)
require_auth();

// Retrieve input data
$input = get_json_input();

$post_id = isset($input['id']) ? filter_var($input['id'], FILTER_VALIDATE_INT) : (isset($_GET['id']) ? filter_var($_GET['id'], FILTER_VALIDATE_INT) : null);

if (!$post_id || $post_id <= 0) {
    send_json_response(false, 'Invalid or missing post ID. Please specify a valid post ID to delete.', null, 400);
}

try {
    $user_id = get_current_user_id();

    // Verify post existence (404) and author authorization (403)
    $postToDelete = verify_post_ownership($pdo, $post_id, $user_id);

    // Delete post record
    $stmt = $pdo->prepare("DELETE FROM blogPost WHERE id = :id");
    $stmt->execute(['id' => $post_id]);

    send_json_response(true, 'Blog post deleted successfully.', [
        'deleted_id' => $post_id,
        'title'      => $postToDelete['title']
    ], 200);

} catch (PDOException $e) {
    send_json_response(false, 'Database error while deleting post: ' . $e->getMessage(), null, 500);
}
