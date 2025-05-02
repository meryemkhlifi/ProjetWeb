<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized - Please log in'
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $method = $_SERVER['REQUEST_METHOD'];

    // Handle GET requests
    if ($method === 'GET') {
        if (isset($_GET['action']) && $_GET['action'] === 'get') {
            $stmt = $pdo->prepare("SELECT * FROM emergency_contacts WHERE user_id = ?");
            $stmt->execute([$userId]);
            $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $contacts
            ]);
            exit;
        }
    }

    // Handle POST requests
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        $required = ['name', 'phone', 'relation'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => "Missing required field: $field"
                ]);
                exit;
            }
        }

        $stmt = $pdo->prepare("INSERT INTO emergency_contacts (user_id, name, phone, relation) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $input['name'], $input['phone'], $input['relation']]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Contact added successfully',
            'id' => $pdo->lastInsertId()
        ]);
        exit;
    }

    // Handle DELETE requests
    if ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (empty($input['id'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Contact ID required'
            ]);
            exit;
        }

        // Only delete if contact belongs to current user
        $stmt = $pdo->prepare("DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?");
        $stmt->execute([$input['id'], $userId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Contact not found or not owned by user'
            ]);
            exit;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Contact deleted successfully'
        ]);
        exit;
    }

    // If no valid method matched
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}