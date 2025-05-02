<?php
require 'db.php';

try {
    // Fetch all users
    $users = $pdo->query("SELECT id, password FROM users")->fetchAll();

    foreach ($users as $user) {
        // Check if the password needs rehashing
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
            // Rehash the password
            $hashed = password_hash($user['password'], PASSWORD_DEFAULT);

            // Update the password in the database
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            $stmt->execute([$hashed, $user['id']]);

            error_log("Password rehashed for user ID: " . $user['id']);
        }
    }

    echo "Passwords updated successfully!";
} catch (Exception $e) {
    error_log("Error during password rehashing: " . $e->getMessage());
    die("An error occurred while updating passwords.");
}
?>