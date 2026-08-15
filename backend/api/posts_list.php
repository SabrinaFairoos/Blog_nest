<?php
/**
 * List All Blog Posts API Endpoint
 * 
 * Fetches all blog posts ordered by creation date (newest first),
 * joins author information, and computes plain-text excerpts.
 * 
 * Method: GET
 * Access: Public
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Method Not Allowed. Use GET to list posts.', null, 405);
}

try {
    // Optional query parameter filtering (Search term or author filter)
    $search = isset($_GET['search']) ? sanitize_input($_GET['search']) : '';
    $author = isset($_GET['author']) ? sanitize_input($_GET['author']) : '';
    $user_id = isset($_GET['user_id']) && is_numeric($_GET['user_id']) ? (int)$_GET['user_id'] : null;

    $sql = "SELECT 
                b.id, 
                b.user_id, 
                b.title, 
                b.content, 
                b.created_at, 
                b.updated_at, 
                u.username AS author,
                u.email AS author_email
            FROM blogPost b
            JOIN user u ON b.user_id = u.id";

    $params = [];
    $where_clauses = [];

    if (!empty($search)) {
        $where_clauses[] = "(b.title LIKE :search OR b.content LIKE :search_content)";
        $params['search'] = '%' . $search . '%';
        $params['search_content'] = '%' . $search . '%';
    }

    if (!empty($author)) {
        $where_clauses[] = "u.username = :author";
        $params['author'] = $author;
    }

    if ($user_id !== null) {
        $where_clauses[] = "b.user_id = :user_id";
        $params['user_id'] = $user_id;
    }

    if (!empty($where_clauses)) {
        $sql .= " WHERE " . implode(" AND ", $where_clauses);
    }

    $sql .= " ORDER BY b.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $current_user_id = get_current_user_id();

    // Process posts: format excerpts and ownership flags
    $posts = [];
    foreach ($rows as $row) {
        $posts[] = [
            'id'           => (int)$row['id'],
            'user_id'      => (int)$row['user_id'],
            'author'       => (string)$row['author'],
            'author_email' => (string)$row['author_email'],
            'title'        => (string)$row['title'],
            'excerpt'      => generate_excerpt($row['content'], 150),
            'content'      => (string)$row['content'],
            'created_at'   => $row['created_at'],
            'updated_at'   => $row['updated_at'],
            'is_owner'     => is_authenticated() && ((int)$row['user_id'] === $current_user_id)
        ];
    }

    send_json_response(true, 'Blog posts retrieved successfully.', [
        'count' => count($posts),
        'posts' => $posts
    ], 200);

} catch (PDOException $e) {
    send_json_response(false, 'Database error while fetching posts: ' . $e->getMessage(), null, 500);
}
