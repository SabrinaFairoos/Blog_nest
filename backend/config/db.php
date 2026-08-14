<?php
/**
 * Database Connection Handler (PDO)
 * 
 * Supports both local XAMPP/WAMP environments and shared hosting (InfinityFree/000webhost).
 * Credentials can be modified directly below or set via environment variables.
 */

// --- Database Credentials Configuration ---
// Update these values if your hosting provider gives you specific credentials.
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'blog_nest_db';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

/**
 * Returns a configured PDO Database Connection instance.
 *
 * @return PDO
 * @throws PDOException
 */
function getDBConnection(): PDO {
    global $db_host, $db_port, $db_name, $db_user, $db_pass;

    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];

    try {
        $pdo = new PDO($dsn, $db_user, $db_pass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Return JSON error response if called via API request
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed. Please verify credentials in backend/config/db.php.',
            'error'   => $e->getMessage()
        ]);
        exit;
    }
}

// Global connection instance for direct file inclusion
$pdo = getDBConnection();
