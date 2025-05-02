<?php
$host = 'localhost';
$dbname = 'webproject';
$username = 'root'; // Default XAMPP username
$password = ''; // Default XAMPP password (empty)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Temporary test for database connection
    $pdo->query("SELECT 1");
    error_log("Database connection successful");
} catch (PDOException $e) {
    error_log("DB Connection failed: " . $e->getMessage());
    die("Database connection failed: " . $e->getMessage());
}
?>