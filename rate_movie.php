<?php
require 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$movieId = $data['movie_id'] ?? null;
$rating = $data['rating'] ?? null;

if (!$movieId || !$rating || $rating < 1 || $rating > 5) {
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO movie_ratings (movie_id, rating) VALUES (?, ?)");
$stmt->execute([$movieId, $rating]);

echo json_encode(['success' => true]);
