<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$movieId = $data['movie_id'] ?? null;
$rating = $data['rating'] ?? null;

if (!$movieId || !$rating || $rating < 1 || $rating > 5) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO ratings (movie_id, rating_value, created_at) VALUES (?, ?, NOW())");
$stmt->execute([$movieId, $rating]);

echo json_encode(['success' => true]);
