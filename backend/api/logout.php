<?php
/**
 * User Logout API Endpoint
 * 
 * Terminates the authenticated user session, clears server-side session variables,
 * and deletes the session cookie.
 * 
 * Method: POST / GET
 */

require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Accept both POST and GET methods for logout
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Method Not Allowed. Use POST or GET for logout.', null, 405);
}

// Clear all session variables
$_SESSION = [];

// Delete the session cookie from the browser if cookies are used
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy the session on the server
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

// Return 200 OK
send_json_response(true, 'Logged out successfully.', null, 200);
