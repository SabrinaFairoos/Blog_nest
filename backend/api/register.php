<?php
/**
 * User Registration API Endpoint
 * 
 * Handles user account creation with robust input validation,
 * duplicate record detection, and secure password hashing.
 * 
 * Method: POST
 * Format: JSON or Form-Data
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../includes/response_helper.php';
require_once __DIR__ . '/../includes/auth_check.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(false, 'Method Not Allowed. Use POST for registration.', null, 405);
}

// Retrieve input data
$input = get_json_input();

$username = sanitize_input($input['username'] ?? '');
$email    = sanitize_input($input['email'] ?? '');
$password = (string)($input['password'] ?? '');

// --- Input Validations ---
$errors = [];

// Validate Username (3-50 chars, alphanumeric and underscore)
if (empty($username)) {
    $errors['username'] = 'Username is required.';
} elseif (strlen($username) < 3 || strlen($username) > 50) {
    $errors['username'] = 'Username must be between 3 and 50 characters.';
} elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    $errors['username'] = 'Username can only contain letters, numbers, and underscores.';
}

// Validate Email
if (empty($email)) {
    $errors['email'] = 'Email address is required.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) {
    $errors['email'] = 'Please enter a valid email address.';
}

// Validate Password (min 6 characters)
if (empty($password)) {
    $errors['password'] = 'Password is required.';
} elseif (strlen($password) < 6) {
    $errors['password'] = 'Password must be at least 6 characters long.';
}

// Return 400 Bad Request if validation fails
if (!empty($errors)) {
    send_json_response(false, 'Validation failed.', ['errors' => $errors], 400);
}

try {
    // Check if username or email already exists
    $stmt = $pdo->prepare("SELECT id, username, email FROM user WHERE username = :username OR email = :email LIMIT 1");
    $stmt->execute([
        'username' => $username,
        'email'    => $email
    ]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        if (strcasecmp($existingUser['username'], $username) === 0) {
            send_json_response(false, 'Username is already taken.', ['field' => 'username'], 409);
        }
        if (strcasecmp($existingUser['email'], $email) === 0) {
            send_json_response(false, 'Email is already registered.', ['field' => 'email'], 409);
        }
    }

    // Hash password securely using standard Bcrypt
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $insertStmt = $pdo->prepare(
        "INSERT INTO user (username, email, password, role, created_at) 
         VALUES (:username, :email, :password, 'user', NOW())"
    );
    $insertStmt->execute([
        'username' => $username,
        'email'    => $email,
        'password' => $hashedPassword
    ]);

    $newUserId = (int)$pdo->lastInsertId();

    // Return 201 Created
    send_json_response(true, 'Registration successful. You can now log in.', [
        'user' => [
            'id'       => $newUserId,
            'username' => $username,
            'email'    => $email,
            'role'     => 'user'
        ]
    ], 201);

} catch (PDOException $e) {
    send_json_response(false, 'Database error during registration: ' . $e->getMessage(), null, 500);
}
