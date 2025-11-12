<?php
$host = getenv('dpg-d4aal3n5r7bs73eadieg-a');
$db   = getenv('prestige_db');
$user = getenv('prestige');
$pass = getenv('prestige');

try {
    $conn = new PDO("pgsql:host=$host;dbname=$db", $user, $pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}
