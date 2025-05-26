<?php
$config = require('config.php');

// Obsługa POST i GET
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_GET; // take get
}

// checking if corrent primpt
if (!isset($input['prompt'])) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required field: prompt']); //probably good idea would be send error code image to system instead
    exit;
}

$model = $config['text_api']['apikey']; // you can put own Model instruction for personality in file prompt.txt
$apiKey = $config['text_api']['model'];
$endpoint = rtrim($config['image_api']['endpoint'], '/') . '/chat/completions';

$prompt = $input['prompt'];

// prepair question to api
$data = [
    "model" => $model,
    "messages" => [
        [
            "role" => "user",
            "content" => $prompt
        ]
    ]
];

// generating random userid and channel
$randomNumber = mt_rand(1000000000, 9999999999);
$randomNumber2 = mt_rand(1000000000, 9999999999);

// send curl
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

// prepairing reply
header('Content-Type: text/plain');
http_response_code($http_code);

$data = json_decode($response, true);

if (isset($data['choices'][0]['message']['content'])) {
    $reply = $data['choices'][0]['message']['content'];
    echo $reply; //prividing reply
    
} else {
    echo "No response received or error: " . json_encode($data);
}
