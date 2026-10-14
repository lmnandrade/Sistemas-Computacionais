<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Carrega os ficheiros pela ordem correta
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Usuario.php';
require_once __DIR__ . '/models/Logger.php';
require_once __DIR__ . '/controllers/AuthController.php';

$action = $_GET['action'] ?? '';
$inputData = file_get_contents("php://input");
$dados = json_decode($inputData, true) ?? $_POST;

$auth = new AuthController();

if ($action === 'cadastro') {
    $auth->cadastro($dados);
} elseif ($action === 'login') {
    $auth->login($dados);
} else {
    http_response_code(400);
    echo json_encode(["erro" => "Ação inválida ou não informada."]);
}