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

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/models/Usuario.php';
require_once __DIR__ . '/models/Transacao.php';
require_once __DIR__ . '/models/Logger.php';
require_once __DIR__ . '/controllers/AuthController.php';

$db = (new Database())->getConnection();
$action = $_GET['action'] ?? '';
$inputData = file_get_contents("php://input");
$dados = json_decode($inputData, true) ?? $_POST;

$auth = new AuthController();

if ($action === 'cadastro') {
    $auth->cadastro($dados);
} elseif ($action === 'login') {
    $auth->login($dados);
} elseif ($action === 'get_perfil') {
    $usuario_id = $_GET['usuario_id'] ?? 0;
    
    // Procura dados atualizados do utilizador
    $stmtUser = $db->prepare("SELECT id, nome_completo, email, cbf, galeoes, sicles, nuques FROM usuarios WHERE id = :id LIMIT 1");
    $stmtUser->bindParam(':id', $usuario_id);
    $stmtUser->execute();
    $usuarioData = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if ($usuarioData) {
        $transacaoModel = new Transacao($db);
        $historico = $transacaoModel->buscarPorUsuario($usuario_id);
        
        echo json_encode([
            "usuario" => $usuarioData,
            "historico" => $historico
        ]);
    } else {
        http_response_code(404);
        echo json_encode(["erro" => "Utilizador não encontrado."]);
    }
} elseif ($action === 'movimentar') {
    $usuario_id = $dados['usuario_id'] ?? 0;
    $tipo = $dados['tipo'] ?? 'ENTRADA';
    $descricao = $dados['descricao'] ?? 'Movimentação no Cofre';
    $valor = (int)($dados['valor'] ?? 0);
    $moeda = $dados['moeda'] ?? 'galeoes';

    if ($usuario_id <= 0 || $valor <= 0) {
        http_response_code(400);
        echo json_encode(["erro" => "Dados inválidos para a operação."]);
        exit();
    }

    $transacaoModel = new Transacao($db);
    if ($transacaoModel->registrar($usuario_id, $tipo, $descricao, $valor, $moeda)) {
        http_response_code(200);
        echo json_encode(["mensagem" => "Operação efetuada com sucesso!"]);
    } else {
        http_response_code(500);
        echo json_encode(["erro" => "Falha ao processar a movimentação."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["erro" => "Ação inválida."]);
}