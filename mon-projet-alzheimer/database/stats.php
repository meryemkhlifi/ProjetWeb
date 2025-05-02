<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
require 'db.php';
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $pdo = getPDO();
    
    // Prepare queries for each statistic
    $queries = [
        'medications' => "SELECT COUNT(*) FROM medications WHERE user_id = ?",
        'prescriptions' => "SELECT COUNT(*) FROM prescriptions WHERE user_id = ?",
        'appointments' => "SELECT COUNT(*) FROM calendar_events WHERE user_id = ?",
        'contacts' => "SELECT COUNT(*) FROM emergency_contacts WHERE user_id = ?"
    ];
    
    $stats = [];
    
    foreach ($queries as $key => $query) {
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $stats[$key] = $stmt->fetchColumn();
    }
    
    echo json_encode([
        'status' => 'success',
        'stats' => $stats
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}