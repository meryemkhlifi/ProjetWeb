<?php
header('Content-Type: application/json');
require 'db.php';
session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get user info
        $stmt = $pdo->prepare("SELECT name, family_name, profession, user_type, email, dob FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            throw new Exception('User not found in database');
        }

        // Get medical info
        $medical = [];
        try {
            $stmt = $pdo->prepare("SELECT blood_type, weight, height, primary_doctor, allergies, conditions FROM user_medical_info WHERE user_id = ?");
            $stmt->execute([$userId]);
            $medical = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        } catch (PDOException $e) {
            error_log("Medical info query error: " . $e->getMessage());
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'personal' => $user,
                'medical' => $medical
            ]
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Update user info
        $stmt = $pdo->prepare("UPDATE users SET 
            name = ?, family_name = ?, profession = ?, dob = ?
            WHERE id = ?");
        $stmt->execute([
            $input['personal']['name'],
            $input['personal']['family_name'],
            $input['personal']['profession'],
            $input['personal']['dob'],
            $userId
        ]);

        // Handle medical info
        if (isset($input['medical'])) {
            // Check if medical record exists
            $exists = $pdo->prepare("SELECT 1 FROM user_medical_info WHERE user_id = ?");
            $exists->execute([$userId]);
            
            if ($exists->fetchColumn()) {
                // Update existing
                $stmt = $pdo->prepare("UPDATE user_medical_info SET 
                    blood_type = ?, weight = ?, height = ?, 
                    primary_doctor = ?, allergies = ?, conditions = ?
                    WHERE user_id = ?");
            } else {
                // Insert new
                $stmt = $pdo->prepare("INSERT INTO user_medical_info 
                    (user_id, blood_type, weight, height, primary_doctor, allergies, conditions)
                    VALUES (?, ?, ?, ?, ?, ?, ?)");
            }
            
            $stmt->execute([
                $userId,
                $input['medical']['blood_type'] ?? null,
                $input['medical']['weight'] ?? null,
                $input['medical']['height'] ?? null,
                $input['medical']['primary_doctor'] ?? null,
                $input['medical']['allergies'] ?? null,
                $input['medical']['conditions'] ?? null
            ]);
        }

        echo json_encode(['success' => true, 'message' => 'Profile updated']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}