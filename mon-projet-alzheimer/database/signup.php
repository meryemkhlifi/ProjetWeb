<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Decode JSON input
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required = ['name', 'family-name', 'profession', 'user-type', 'dob', 'email', 'password'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            die(json_encode(['success' => false, 'message' => "Missing $field"]));
        }
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Invalid email']));
    }

    // Check if the email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(409); // Conflict
        die(json_encode(['success' => false, 'message' => 'Email already exists']));
    }

    // Hash the password
    $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);

    // Insert the new user
    $stmt = $pdo->prepare("INSERT INTO users (name, family_name, profession, user_type, dob, email, password) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['name'],
        $data['family-name'],
        $data['profession'],
        $data['user-type'],
        $data['dob'],
        $data['email'],
        $hashedPassword
    ]);

    // Respond with success
    echo json_encode([
        'success' => true,
        'message' => 'User created successfully',
        'user_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    // Handle database errors
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
