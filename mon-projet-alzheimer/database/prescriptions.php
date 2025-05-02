<?php
require 'db.php';
header('Content-Type: application/json');
session_start();

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Verify user is logged in
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Unauthorized - Please login', 401);
    }

    $user_id = $_SESSION['user_id'];
    $uploadDir = '../uploads/prescriptions/' . $user_id . '/';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle file upload
        if (!isset($_FILES['prescription']) || $_FILES['prescription']['error'] !== UPLOAD_ERR_OK) {
            throw new Exception('No file uploaded or upload error', 400);
        }

        $file = $_FILES['prescription'];
        
        // Validate file size (max 10MB)
        if ($file['size'] > 10 * 1024 * 1024) {
            throw new Exception('File size exceeds 10MB limit', 400);
        }
        
        // Validate file type
        $allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!in_array($file['type'], $allowed_types)) {
            throw new Exception('Invalid file type. Only PDF, JPG, and PNG allowed', 400);
        }

        // Create user-specific upload directory
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid('rx_', true) . '.' . $extension;
        $filepath = $uploadDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            throw new Exception('Failed to save file', 500);
        }

        // Store in database
        $stmt = $pdo->prepare("INSERT INTO prescriptions 
                              (user_id, file_name, file_path, file_type, file_size, notes) 
                              VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $user_id,
            $file['name'],
            $filepath,
            $file['type'],
            $file['size'],
            $_POST['notes'] ?? null
        ]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Prescription uploaded successfully',
            'file' => [
                'id' => $pdo->lastInsertId(),
                'name' => $file['name']
            ]
        ]);
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all prescriptions for current user
        $stmt = $pdo->prepare("SELECT id, file_name, file_path, file_type, file_size, upload_date 
                              FROM prescriptions 
                              WHERE user_id = ? 
                              ORDER BY upload_date DESC");
        $stmt->execute([$user_id]);
        $prescriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'status' => 'success',
            'prescriptions' => $prescriptions
        ]);
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Handle prescription deletion
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;

        if (!$id) {
            throw new Exception('Prescription ID required', 400);
        }

        // Verify prescription belongs to user
        $stmt = $pdo->prepare("SELECT file_path FROM prescriptions WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        $prescription = $stmt->fetch();

        if (!$prescription) {
            throw new Exception('Prescription not found or not authorized', 404);
        }

        // Delete file from server
        if (file_exists($prescription['file_path'])) {
            unlink($prescription['file_path']);
        }

        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM prescriptions WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);

        echo json_encode([
            'status' => 'success',
            'message' => 'Prescription deleted successfully'
        ]);
    }
    else {
        throw new Exception('Method not allowed', 405);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>