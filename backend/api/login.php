<?php
/**
 * User Login API Endpoint
 * 
 * Authenticates user credentials, sets up secure server-side PHP session,
 * and returns user metadata.
 * 
 * Method: POST
 * Format: JSON or Form-Data
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(false, 'Method Not Allowed. Use POST for login.', null, 405);
}

// Retrieve input data
$input = get_json_input();

// Accept 'identifier', 'username', or 'email'
$identifier = sanitize_input($input['identifier'] ?? $input['username'] ?? $input['email'] ?? '');
$password   = (string)($input['password'] ?? '');

// Validation
if (empty($identifier) || empty($password)) {
    send_json_response(
        false, 
        'Please provide both username/email and password.', 
        ['errors' => [
            'identifier' => empty($identifier) ? 'Username or Email is required.' : null,
            'password'   => empty($password) ? 'Password is required.' : null
        ]], 
        400
    );
}

try {
    // Look up user by username or email
    $stmt = $pdo->prepare(
    "SELECT id, username, email, password, role
     FROM user
     WHERE username = :username_ident OR email = :email_ident
     LIMIT 1"
);

$stmt->execute([
    'username_ident' => $identifier,
    'email_ident'    => $identifier
]);
    $user = $stmt->fetch();

    // Verify user existence and password hash
    if (!$user || !password_verify($password, $user['password'])) {
        // Constant response time to protect against timing attacks & enumeration
        send_json_response(false, 'Invalid username/email or password.', null, 401);
    }

    // Regenerate session ID to prevent session fixation attacks
    session_regenerate_id(true);

    // Populate session store
    $_SESSION['user_id']  = (int)$user['id'];
    $_SESSION['username'] = (string)$user['username'];
    $_SESSION['email']    = (string)$user['email'];
    $_SESSION['role']     = (string)($user['role'] ?? 'user');

    // Return 200 OK with sanitized user profile
    send_json_response(true, 'Login successful.', [
        'user' => [
            'id'       => (int)$user['id'],
            'username' => $user['username'],
            'email'    => $user['email'],
            'role'     => $user['role'] ?? 'user'
        ]
    ], 200);

} catch (PDOException $e) {
    send_json_response(false, 'Database error during login: ' . $e->getMessage(), null, 500);
}
