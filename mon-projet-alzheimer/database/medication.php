<?php
require 'db.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

session_start();

try {
    // Check if user is logged in - REQUIRED
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Unauthorized - Please login', 401);
    }

    $user_id = $_SESSION['user_id'];
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $required = ['name', 'dose', 'time'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                throw new Exception("Missing required field: $field", 400);
            }
        }

        $stmt = $pdo->prepare("INSERT INTO medications 
                             (user_id, name, dose, time, frequency, instructions) 
                             VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $user_id,
            $input['name'],
            $input['dose'],
            $input['time'],
            $input['frequency'] ?? null,
            $input['instructions'] ?? null
        ]);

        echo json_encode([
            'status' => 'success', 
            'message' => 'Medication added successfully'
        ]);
    } 
    elseif ($method === 'GET') {
        $stmt = $pdo->prepare("SELECT id, name, dose, time, frequency, instructions 
                             FROM medications 
                             WHERE user_id = ? 
                             ORDER BY time");
        $stmt->execute([$user_id]);
        $medications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success', 
            'medications' => $medications
        ]);
    } 
    elseif ($method === 'DELETE') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = $input['id'] ?? null;

        if (!$id) {
            throw new Exception('Medication ID is required', 400);
        }

        $stmt = $pdo->prepare("DELETE FROM medications WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);

        if ($stmt->rowCount() === 0) {
            throw new Exception('Medication not found or not authorized', 404);
        }

        echo json_encode([
            'status' => 'success', 
            'message' => 'Medication deleted successfully'
        ]);
    } 
    else {
        throw new Exception('Method not allowed', 405);
    }
} 
catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage()
    ]);
}

?>