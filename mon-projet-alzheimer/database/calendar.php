<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php'; // Include the database connection file

// Get JSON input
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

// Support both JSON and GET
$action = $data['action'] ?? ($_GET['action'] ?? null);

if (!$action) {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
    exit;
}

try {
    // Handle actions
    if ($action === 'fetch') {
        // Fetch events
        $stmt = $pdo->query("SELECT * FROM calendar_events");
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "events" => $events]);
    } elseif ($action === 'add') {
        $stmt = $pdo->prepare("INSERT INTO calendar_events (title, start_datetime, end_datetime, color, description, location, reminder) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['title'], $data['start_datetime'], $data['end_datetime'], $data['color'],
            $data['description'], $data['location'], $data['reminder']
        ]);
        echo json_encode(["status" => "success"]);
    } elseif ($action === 'update') {
        $stmt = $pdo->prepare("UPDATE calendar_events SET title=?, start_datetime=?, end_datetime=?, color=?, description=?, location=?, reminder=? WHERE id=?");
        $stmt->execute([
            $data['title'], $data['start_datetime'], $data['end_datetime'], $data['color'],
            $data['description'], $data['location'], $data['reminder'], $data['id']
        ]);
        echo json_encode(["status" => "success"]);
    } elseif ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM calendar_events WHERE id=?");
        $stmt->execute([$data['id']]);
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
}