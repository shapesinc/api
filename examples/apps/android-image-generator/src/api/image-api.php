<?php
$config = require('config.php');

// Obsługa POST i GET
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_GET; // Spróbuj odczytać dane z GET
}

// Sprawdzenie poprawności wejścia
if (!isset($input['prompt'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required field: prompt']);
    exit;
}

$model = $config['image_api']['model']; // you can put own Model, prompt for it inside prompt.txt
$apiKey = $config['image_api']['apikey'];
$endpoint = rtrim($config['image_api']['endpoint'], '/') . '/chat/completions';

$prompt = $input['prompt'];

// Utwórz dane zapytania
$data = [
    "model" => $model,
    "messages" => [
        [
            "role" => "user",
            "content" => "!imagine " . $prompt
        ]
    ]
];

// generate random userid
$randomNumber = mt_rand(1000000000, 9999999999);
$randomNumber2 = mt_rand(1000000000, 9999999999);

// Wysyłka cURL
$ch = curl_init($endpoint);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'X-User-Id: ' . $randomNumber,
        'X-Channel-Id: ' . $randomNumber2,
        'Authorization: Bearer ' . $apiKey
    ],
    CURLOPT_POSTFIELDS => json_encode($data)
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// prep response
header('Content-Type: text/plain');
http_response_code($http_code);

$data = json_decode($response, true);

if (isset($data['choices'][0]['message']['content'])) {
    $reply = $data['choices'][0]['message']['content'];

    // Szukamy URL (https)
    preg_match('/https?:\/\/[^\s"]+/i', $reply, $matches);
    $image_url = $matches[0] ?? null;

    if ($image_url) {
        echo $image_url; // tylko URL, jeśli jest
    } else {
        echo $reply; // tylko tekst, jeśli brak URL
    }
} else {
    echo "No response received or error: " . json_encode($data);
}
