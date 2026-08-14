<?php
/**
 * Authentication and Ownership Verification Utilities
 * 
 * Manages PHP session lifecycle and enforces server-side access control.
 */

require_once __DIR__ . '/response_helper.php';

// Initialize session if not already active
if (session_status() === PHP_SESSION_NONE) {
    // Configure secure session cookie parameters
    session_start();
}

/**
 * Checks if there is an active authenticated session.
 *
 * @return bool
 */
function is_authenticated(): bool {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Returns the currently authenticated user's ID or null.
 *
 * @return int|null
 */
function get_current_user_id(): ?int {
    return is_authenticated() ? (int)$_SESSION['user_id'] : null;
}

/**
 * Returns the currently authenticated username or null.
 *
 * @return string|null
 */
function get_current_username(): ?string {
    return is_authenticated() ? (string)$_SESSION['username'] : null;
}

/**
 * Enforces authentication. Halts request with 401 if user is not logged in.
 *
 * @return void
 */
function require_auth(): void {
    if (!is_authenticated()) {
        send_json_response(
            false,
            'Unauthorized: Please log in to perform this action.',
            null,
            401
        );
    }
}

/**
 * Verifies that a blog post exists and belongs to the currently logged-in user.
 * Sends 404 if not found, or 403 if user is not the author.
 *
 * @param PDO $pdo Active PDO connection
 * @param int $post_id ID of the post
 * @param int $user_id ID of the requesting user
 * @return array Post data associative array
 */
function verify_post_ownership(PDO $pdo, int $post_id, int $user_id): array {
    $stmt = $pdo->prepare("SELECT * FROM blogPost WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $post_id]);
    $post = $stmt->fetch();

    if (!$post) {
        send_json_response(false, 'Blog post not found.', null, 404);
    }

    // Strict server-side ownership check
    if ((int)$post['user_id'] !== $user_id) {
        send_json_response(
            false,
            'Forbidden: You are not authorized to modify this post.',
            null,
            403
        );
    }

    return $post;
}
