<?php
/**
 * Standardized Response and Input Sanitization Helpers
 * 
 * Provides consistent JSON dispatching, input decoding, and content extraction.
 */

// Enable CORS and JSON response headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Sends a structured JSON HTTP response and terminates script execution.
 *
 * @param bool $success Whether the request succeeded
 * @param string $message Descriptive status message
 * @param mixed $data Optional payload data
 * @param int $http_code HTTP status code (e.g. 200, 201, 400, 401, 403, 404, 500)
 */
function send_json_response(bool $success, string $message, $data = null, int $http_code = 200): void {
    http_response_code($http_code);
    header('Content-Type: application/json; charset=utf-8');

    $response = [
        'success' => $success,
        'message' => $message
    ];

    if ($data !== null) {
        $response['data'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Decodes incoming JSON payload from php://input or falls back to $_POST.
 *
 * @return array
 */
function get_json_input(): array {
    $raw_input = file_get_contents('php://input');
    $decoded = json_decode($raw_input, true);

    if (is_array($decoded)) {
        return $decoded;
    }

    return !empty($_POST) ? $_POST : [];
}

/**
 * Basic sanitization for text inputs.
 * Trims whitespace and strips control characters while preserving Markdown formatting.
 *
 * @param mixed $value
 * @return string
 */
function sanitize_input($value): string {
    if (!is_string($value)) {
        return '';
    }
    return trim($value);
}

/**
 * Generates a clean plain-text excerpt from raw Markdown content.
 *
 * @param string $markdown Raw markdown content
 * @param int $length Maximum character length for excerpt
 * @return string Plain text excerpt
 */
function generate_excerpt(string $markdown, int $length = 150): string {
    // Remove code blocks
    $text = preg_replace('/```[\s\S]*?```/', '', $markdown);
    // Remove inline code
    $text = preg_replace('/`([^`]+)`/', '$1', $text);
    // Remove markdown headers (#, ##, etc.)
    $text = preg_replace('/^#{1,6}\s+/m', '', $text);
    // Remove markdown links [text](url) -> text
    $text = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $text);
    // Remove markdown images ![alt](url) -> ''
    $text = preg_replace('/!\[([^\]]*)\]\([^\)]+\)/', '', $text);
    // Remove bold and italic markers
    $text = preg_replace('/(\*\*|__)(.*?)\1/', '$2', $text);
    $text = preg_replace('/(\*|_)(.*?)\1/', '$2', $text);
    // Remove blockquotes and list markers
    $text = preg_replace('/^>\s+/m', '', $text);
    $text = preg_replace('/^[\*\-\+]\s+/m', '', $text);
    $text = preg_replace('/^\d+\.\s+/m', '', $text);
    // Collapse multiple whitespaces/newlines to single space
    $text = trim(preg_replace('/\s+/', ' ', $text));

    if (mb_strlen($text) <= $length) {
        return $text;
    }

    return mb_substr($text, 0, $length) . '...';
}
