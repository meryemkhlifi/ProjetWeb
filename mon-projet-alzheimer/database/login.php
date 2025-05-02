<?php
require 'db.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

try {
    // Get JSON input
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // Debug received data
    file_put_contents('login_debug.txt', 
        "Raw Input: $json\n\n" .
        "Decoded Data: " . print_r($data, true) . "\n\n" .
        "POST Data: " . print_r($_POST, true)
    );

    if (!$data || empty($data['email']) || empty($data['password'])) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Email and password required']));
    }

    // Case-insensitive email search
    $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([trim($data['email'])]);
    $user = $stmt->fetch();

    if (!$user) {
        error_log("User not found: " . $data['email']);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }

    // Verify password
    if (!password_verify($data['password'], $user['password'])) {
        error_log("Password mismatch for: " . $data['email']);
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Invalid credentials']));
    }
        session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];

    // Successful login
    echo json_encode([
        'success' => true,
        'user_id' => $user['id'],
        'user_name' => $user['name'], // Add this line
        'redirect' => 'home.html'
    ]);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>