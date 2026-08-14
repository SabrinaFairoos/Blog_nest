<?php
/**
 * Session Status Verification API Endpoint
 * 
 * Inspects the current session and returns the authentication state and
 * basic user information for frontend dynamic navigation rendering.
 * 
 * Method: GET
 */

require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(false, 'Method Not Allowed. Use GET for auth status.', null, 405);
}

if (is_authenticated()) {
    send_json_response(true, 'User is authenticated.', [
        'authenticated' => true,
        'user' => [
            'id'       => (int)$_SESSION['user_id'],
            'username' => (string)$_SESSION['username'],
            'email'    => $_SESSION['email'] ?? null,
            'role'     => $_SESSION['role'] ?? 'user'
        ]
    ], 200);
} else {
    send_json_response(true, 'User is not authenticated.', [
        'authenticated' => false,
        'user'          => null
    ], 200);
}
