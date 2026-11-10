<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Carrega as variáveis de ambiente do arquivo .env
require_once __DIR__ . '/config/env.php';

define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? getenv('JWT_SECRET') ?? 'Gringotts_Chave_Secreta_JWT_2026_Bruxaria_Segura!');
define('MODO_DEV', filter_var($_ENV['MODO_DEV'] ?? getenv('MODO_DEV') ?? true, FILTER_VALIDATE_BOOLEAN));

function base64url_encode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function base64url_decode($data) {
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

function gerarJWT($payload) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['exp'] = time() + (8 * 3600); // Expiração em 8 horas

    $base64UrlHeader = base64url_encode($header);
    $base64UrlPayload = base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64url_encode($signature);

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function validarJWT() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return false;
    }

    $token = $matches[1];
    $partes = explode('.', $token);
    if (count($partes) !== 3) return false;

    list($header, $payload, $signature) = $partes;

    $validSignature = base64url_encode(hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true));

    if (!hash_equals($validSignature, $signature)) return false;

    $dados = json_decode(base64url_decode($payload), true);

    if (isset($dados['exp']) && $dados['exp'] < time()) return false;

    return $dados;
}

require_once __DIR__ . '/config/database.php';

if (file_exists(__DIR__ . '/models/Logger.php')) require_once __DIR__ . '/models/Logger.php';
if (file_exists(__DIR__ . '/models/Usuario.php')) require_once __DIR__ . '/models/Usuario.php';
if (file_exists(__DIR__ . '/models/Transacao.php')) require_once __DIR__ . '/models/Transacao.php';
if (file_exists(__DIR__ . '/controllers/AuthController.php')) require_once __DIR__ . '/controllers/AuthController.php';
if (file_exists(__DIR__ . '/models/Agendamento.php')) require_once __DIR__ . '/models/Agendamento.php';

try {
    $db = (new Database())->getConnection();
    $logger = class_exists('Logger') ? new Logger($db) : null;
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro na conexão com o banco de dados.",
        "detalhes" => MODO_DEV ? $e->getMessage() : "Consulte os logs do sistema."
    ]);
    exit();
}

$action = $_GET['action'] ?? '';
$inputData = file_get_contents("php://input");
$dados = json_decode($inputData, true) ?? $_POST;

if (empty($action) && isset($dados['action'])) {
    $action = $dados['action'];
}

$auth = class_exists('AuthController') ? new AuthController() : null;

try {
    switch ($action) {

        case 'cadastro':
            if ($auth) {
                $auth->cadastro($dados);
                if ($logger) $logger->registrar(null, 'CADASTRO_SOLICITADO', "E-mail: " . ($dados['email'] ?? 'N/A'));
            }
            break;

        case 'login':
            $email = trim($dados['email'] ?? '');
            $senha = $dados['senha'] ?? '';

            if (empty($email) || empty($senha)) {
                if ($logger) $logger->registrar(null, 'LOGIN_FALHA', "Campos obrigatórios ausentes para: {$email}");
                http_response_code(400);
                echo json_encode(["erro" => "E-mail e senha são obrigatórios."]);
                exit();
            }

            $stmt = $db->prepare("SELECT * FROM usuarios WHERE TRIM(email) = :email OR TRIM(cbf) = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($usuario) {
                $senhaHash = $usuario['senha_hash'] ?? $usuario['senha'] ?? '';

                if (!empty($senhaHash) && password_verify($senha, $senhaHash)) {
                    unset($usuario['senha_hash'], $usuario['senha']);
                    $usuario['email'] = trim($usuario['email']);

                    $tokenPayload = [
                        'usuario_id' => $usuario['id'],
                        'email'      => $usuario['email'],
                        'perfil_id'  => (int)($usuario['perfil_id'] ?? 1)
                    ];

                    $token = gerarJWT($tokenPayload);

                    if ($logger) $logger->registrar($usuario['id'], 'LOGIN_SUCESSO', "Autenticação bem-sucedida via e-mail/CBF: {$email}");

                    echo json_encode([
                        "sucesso"  => true,
                        "mensagem" => "Login realizado com sucesso!",
                        "token"    => $token,
                        "usuario"  => $usuario
                    ]);
                    exit();
                }
            }

            if ($logger) $logger->registrar(null, 'LOGIN_FALHA', "Tentativa de login frustrada para: {$email}");
            http_response_code(401);
            echo json_encode(["erro" => "E-mail ou senha incorretos."]);
            break;

        case 'alterar_senha':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? 0;

            $senhaAtual = $dados['senha_atual'] ?? '';
            $novaSenha = $dados['nova_senha'] ?? '';

            if (!$usuario_id) {
                if ($logger) $logger->registrar(null, 'ALTERAR_SENHA_NEGADO', "Token inválido ou sessão expirada.");
                http_response_code(401);
                echo json_encode(["erro" => "Sessão inválida ou expirada."]);
                exit();
            }

            if (empty($senhaAtual) || empty($novaSenha)) {
                http_response_code(400);
                echo json_encode(["erro" => "Informe a senha atual e a nova senha."]);
                exit();
            }

            if (
                strlen($novaSenha) <= 6 || 
                !preg_match('/[A-Z]/', $novaSenha) || 
                !preg_match('/[a-z]/', $novaSenha) || 
                !preg_match('/[0-9]/', $novaSenha) || 
                !preg_match('/[^A-Za-z0-9]/', $novaSenha)
            ) {
                if ($logger) $logger->registrar($usuario_id, 'ALTERAR_SENHA_FALHA', "Nova senha não cumpre requisitos de complexidade.");
                http_response_code(400);
                echo json_encode(["erro" => "A nova senha deve ter mais de 6 caracteres e conter letras maiúsculas, minúsculas, números e caracteres especiais."]);
                exit();
            }

            $stmt = $db->prepare("SELECT * FROM usuarios WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $usuario_id]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$usuario) {
                http_response_code(404);
                echo json_encode(["erro" => "Usuário não encontrado."]);
                exit();
            }

            $hashAtual = $usuario['senha_hash'] ?? $usuario['senha'] ?? '';

            if (!password_verify($senhaAtual, $hashAtual)) {
                if ($logger) $logger->registrar($usuario_id, 'ALTERAR_SENHA_FALHA', "Senha atual incorreta.");
                http_response_code(400);
                echo json_encode(["erro" => "A senha atual está incorreta."]);
                exit();
            }

            $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);

            try {
                $stmtUpdate = $db->prepare("UPDATE usuarios SET senha_hash = :hash WHERE id = :id");
                $stmtUpdate->execute([':hash' => $novoHash, ':id' => $usuario_id]);
            } catch (Exception $e) {
                $stmtUpdate = $db->prepare("UPDATE usuarios SET senha = :hash WHERE id = :id");
                $stmtUpdate->execute([':hash' => $novoHash, ':id' => $usuario_id]);
            }

            if ($logger) $logger->registrar($usuario_id, 'ALTERAR_SENHA_SUCESSO', "Senha/chave de acesso alterada com sucesso.");
            echo json_encode(["sucesso" => true, "mensagem" => "Chave de acesso (senha) alterada com sucesso!"]);
            break;

        case 'atualizar_perfil':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? 0;

            if (!$usuario_id) {
                http_response_code(401);
                echo json_encode(["erro" => "Sessão inválida ou expirada."]);
                exit();
            }

            $nomeCompleto = trim($dados['nome_completo'] ?? '');
            $familia = trim($dados['familia'] ?? '');
            $profissao = trim($dados['profissao'] ?? '');
            $fotoPerfil = $dados['foto_perfil'] ?? null;

            if (empty($nomeCompleto)) {
                http_response_code(400);
                echo json_encode(["erro" => "O nome completo não pode estar vazio."]);
                exit();
            }

            $sql = "UPDATE usuarios SET nome_completo = :nome, familia = :fam, profissao = :prof";
            $params = [
                ':nome' => $nomeCompleto,
                ':fam'  => $familia,
                ':prof' => $profissao,
                ':id'   => $usuario_id
            ];

            if ($fotoPerfil !== null && $fotoPerfil !== '') {
                $sql .= ", foto_perfil = :foto";
                $params[':foto'] = $fotoPerfil;
            }

            $sql .= " WHERE id = :id";

            $stmt = $db->prepare($sql);
            if ($stmt->execute($params)) {
                $stmtUser = $db->prepare("SELECT id, nome_completo, email, cbf, familia, profissao, galeoes, sicles, nuques, tipo_cofre, foto_perfil FROM usuarios WHERE id = :id LIMIT 1");
                $stmtUser->execute([':id' => $usuario_id]);
                $usuarioAtualizado = $stmtUser->fetch(PDO::FETCH_ASSOC);

                if ($logger) $logger->registrar($usuario_id, 'ATUALIZAR_PERFIL_SUCESSO', "Dados de perfil e/ou foto atualizados.");

                echo json_encode([
                    "sucesso"  => true,
                    "mensagem" => "Perfil atualizado com sucesso!",
                    "usuario"  => $usuarioAtualizado
                ]);
            } else {
                if ($logger) $logger->registrar($usuario_id, 'ATUALIZAR_PERFIL_FALHA', "Falha ao executar query de atualização no banco de dados.");
                http_response_code(500);
                echo json_encode(["erro" => "Falha ao atualizar dados no banco de dados."]);
            }
            break;

        case 'get_perfil':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $_GET['usuario_id'] ?? $dados['usuario_id'] ?? 0;

            if (!$usuario_id) {
                http_response_code(401);
                echo json_encode(["erro" => "Sessão inválida ou expirada."]);
                exit();
            }

            $stmtUser = $db->prepare("SELECT id, nome_completo, email, cbf, familia, profissao, galeoes, sicles, nuques, tipo_cofre, foto_perfil FROM usuarios WHERE id = :id LIMIT 1");
            $stmtUser->execute([':id' => $usuario_id]);
            $usuarioData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if ($usuarioData) {
                $usuarioData['email'] = trim($usuarioData['email']);
                $historico = [];
                if (class_exists('Transacao')) {
                    $transacaoModel = new Transacao($db);
                    $historico = $transacaoModel->buscarPorUsuario($usuario_id);
                }
                echo json_encode(["usuario" => $usuarioData, "historico" => $historico]);
            } else {
                http_response_code(404);
                echo json_encode(["erro" => "Utilizador não encontrado."]);
            }
            break;

        case 'movimentar':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? 0;
            $tipo = $dados['tipo'] ?? 'ENTRADA';
            $descricao = $dados['descricao'] ?? 'Movimentação no Cofre';
            $valor = (int)($dados['valor'] ?? 0);
            $moeda = $dados['moeda'] ?? 'galeoes';

            if (!$usuario_id || $valor <= 0) {
                if ($logger) $logger->registrar($usuario_id, 'MOVIMENTACAO_FALHA', "Parâmetros de movimentação inválidos.");
                http_response_code(400);
                echo json_encode(["erro" => "Dados inválidos ou sessão não autenticada."]);
                exit();
            }

            if (class_exists('Transacao')) {
                $transacaoModel = new Transacao($db);
                if ($transacaoModel->registrar($usuario_id, $tipo, $descricao, $valor, $moeda)) {
                    if ($logger) $logger->registrar($usuario_id, 'MOVIMENTACAO_SUCESSO', "{$tipo} de {$valor} {$moeda}. Descrição: {$descricao}");
                    echo json_encode(["mensagem" => "Operação efetuada com sucesso!"]);
                } else {
                    if ($logger) $logger->registrar($usuario_id, 'MOVIMENTACAO_FALHA', "Erro ao processar movimentação.");
                    http_response_code(500);
                    echo json_encode(["erro" => "Falha ao processar a movimentação."]);
                }
            }
            break;

        case 'listar_usuarios':
            $stmt = $db->prepare("SELECT id, nome_completo, email, cbf, familia, profissao, tipo_cofre, foto_perfil FROM usuarios ORDER BY id ASC");
            $stmt->execute();
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["sucesso" => true, "usuarios" => $usuarios]);
            break;

        case 'agendar':
            if (empty($dados['nome']) || empty($dados['email']) || empty($dados['servico']) || empty($dados['data_visita']) || empty($dados['horario_visita'])) {
                http_response_code(400);
                echo json_encode(["erro" => "Preencha todos os campos obrigatórios para o agendamento."]);
                exit();
            }

            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? null;

            if (class_exists('Agendamento')) {
                $dados['usuario_id'] = $usuario_id;
                $agendamentoModel = new Agendamento($db);
                if ($agendamentoModel->criar($dados)) {
                    if ($logger) $logger->registrar($usuario_id, 'AGENDAMENTO_CRIADO', "Agendamento para {$dados['data_visita']} às {$dados['horario_visita']}. Serviço: {$dados['servico']}");
                    http_response_code(201);
                    echo json_encode(["mensagem" => "Agendamento realizado com sucesso! Os Goblins aguardam sua visita."]);
                } else {
                    if ($logger) $logger->registrar($usuario_id, 'AGENDAMENTO_FALHA', "Falha ao registrar agendamento.");
                    http_response_code(500);
                    echo json_encode(["erro" => "Falha ao registrar agendamento na base de dados."]);
                }
            } else {
                $stmt = $db->prepare("INSERT INTO agendamentos (usuario_id, nome, email, telefone, servico, data_visita, horario_visita, status) VALUES (:uid, :nome, :email, :tel, :serv, :dt, :hr, 'PENDENTE')");
                $stmt->execute([
                    ':uid' => $usuario_id,
                    ':nome' => $dados['nome'],
                    ':email' => $dados['email'],
                    ':tel' => $dados['telefone'] ?? '',
                    ':serv' => $dados['servico'],
                    ':dt' => $dados['data_visita'],
                    ':hr' => $dados['horario_visita']
                ]);
                if ($logger) $logger->registrar($usuario_id, 'AGENDAMENTO_CRIADO', "Agendamento registrado via query direta.");
                http_response_code(201);
                echo json_encode(["mensagem" => "Agendamento realizado com sucesso!"]);
            }
            break;

        case 'solicitar_chave':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? 0;

            $nome_titular = $dados['nome_titular'] ?? '';
            $numero_cofre = $dados['numero_cofre'] ?? 0;
            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $motivo = $dados['motivo'] ?? '';
            $tipo_chave = $dados['tipo_chave'] ?? '';
            $metodo_retirada = $dados['metodo_retirada'] ?? '';
            $detalhes_incidente = $dados['detalhes_incidente'] ?? '';

            if (!$usuario_id) {
                http_response_code(401);
                echo json_encode(["erro" => "Acesso não autorizado. Faça login novamente."]);
                exit();
            }

            if (empty($nome_titular) || !$numero_cofre || empty($motivo)) {
                http_response_code(400);
                echo json_encode(["erro" => "Preencha todos os campos obrigatórios para solicitar a chave."]);
                exit();
            }

            $sql = "INSERT INTO solicitacoes_chave (usuario_id, nome_titular, numero_cofre, registro_ministerio, motivo, tipo_chave, metodo_retirada, detalhes_incidente) 
                    VALUES (:uid, :nome, :cofre, :reg, :motivo, :tipo, :metodo, :detalhes)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':uid' => $usuario_id,
                ':nome' => $nome_titular,
                ':cofre' => $numero_cofre,
                ':reg' => $registro_ministerio,
                ':motivo' => $motivo,
                ':tipo' => $tipo_chave,
                ':metodo' => $metodo_retirada,
                ':detalhes' => $detalhes_incidente
            ]);

            if ($logger) $logger->registrar($usuario_id, 'SOLICITACAO_CHAVE', "Chave solicitada para o cofre #{$numero_cofre}. Motivo: {$motivo}");
            http_response_code(201);
            echo json_encode(["mensagem" => "Solicitação de chave registrada com sucesso!"]);
            break;

        case 'solicitar_cartao':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? 0;

            $nome_bruxo = $dados['nome_bruxo'] ?? '';
            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $criterio_elegibilidade = $dados['criterio_elegibilidade'] ?? '';

            if (!$usuario_id) {
                http_response_code(401);
                echo json_encode(["erro" => "Acesso não autorizado. Faça login novamente."]);
                exit();
            }

            if (empty($nome_bruxo) || empty($criterio_elegibilidade)) {
                http_response_code(400);
                echo json_encode(["erro" => "Preencha todos os campos da avaliação do cartão."]);
                exit();
            }

            $sql = "INSERT INTO solicitacoes_cartao (usuario_id, nome_bruxo, registro_ministerio, criterio_elegibilidade) 
                    VALUES (:uid, :nome, :reg, :criterio)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':uid' => $usuario_id,
                ':nome' => $nome_bruxo,
                ':reg' => $registro_ministerio,
                ':criterio' => $criterio_elegibilidade
            ]);

            if ($logger) $logger->registrar($usuario_id, 'SOLICITACAO_CARTAO', "Avaliação de Cartão Black para: {$nome_bruxo}");
            http_response_code(201);
            echo json_encode(["mensagem" => "Pedido de Avaliação do Cartão Black enviado aos duendes!"]);
            break;

        case 'solicitar_emprestimo':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? 0;

            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $valor_galeoes = $dados['valor_galeoes'] ?? 0;
            $prazo_meses = $dados['prazo_meses'] ?? 12;
            $garantia = $dados['garantia'] ?? 'nenhuma';

            if (!$usuario_id) {
                http_response_code(401);
                echo json_encode(["erro" => "Acesso não autorizado. Faça login novamente."]);
                exit();
            }

            if ($valor_galeoes <= 0) {
                http_response_code(400);
                echo json_encode(["erro" => "Informe um valor válido para o empréstimo."]);
                exit();
            }

            $sql = "INSERT INTO solicitacoes_emprestimo (usuario_id, registro_ministerio, valor_galeoes, prazo_meses, garantia) 
                    VALUES (:uid, :reg, :valor, :prazo, :garantia)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':uid' => $usuario_id,
                ':reg' => $registro_ministerio,
                ':valor' => $valor_galeoes,
                ':prazo' => $prazo_meses,
                ':garantia' => $garantia
            ]);

            if ($logger) $logger->registrar($usuario_id, 'SOLICITACAO_EMPRESTIMO', "Solicitação de {$valor_galeoes} Galeões em {$prazo_meses} meses.");
            http_response_code(201);
            echo json_encode(["mensagem" => "Solicitação de empréstimo em Galeões registrada com sucesso!"]);
            break;

        case 'alterar_tipo_cofre':
            $dadosToken = validarJWT();
            $usuario_id = $dadosToken['usuario_id'] ?? $dados['usuario_id'] ?? 0;
            $tipo_cofre = $dados['tipo_cofre'] ?? '';

            if (!$usuario_id || empty($tipo_cofre)) {
                http_response_code(400);
                echo json_encode(["erro" => "Parâmetros inválidos ou sessão expirada."]);
                exit();
            }

            $sql = "UPDATE usuarios SET tipo_cofre = :tipo WHERE id = :uid";
            $stmt = $db->prepare($sql);
            $stmt->execute([':tipo' => $tipo_cofre, ':uid' => $usuario_id]);

            if ($logger) $logger->registrar($usuario_id, 'ALTERAR_CATEGORIA_COFRE', "Nova categoria: {$tipo_cofre}");
            echo json_encode([
                "sucesso" => true,
                "mensagem" => "Categoria do cofre atualizada com sucesso!"
            ]);
            break;

        case 'listar_dados_admin':
            $dadosToken = validarJWT();
            $emailToken = strtolower(trim($dadosToken['email'] ?? ''));
            $eAdmin = (substr($emailToken, -14) === '@gringotts.com');

            if (!$dadosToken || !$eAdmin) {
                if ($logger) $logger->registrar($dadosToken['usuario_id'] ?? null, 'ACESSO_ADMIN_NEGADO', "Tentativa de acesso ao painel admin.");
                http_response_code(403);
                echo json_encode(["erro" => "Acesso restrito aos administradores do Banco Gringotts."]);
                exit();
            }

            $funcBuscar = function($sql) use ($db) {
                try {
                    $stmt = $db->query($sql);
                    return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
                } catch (Exception $e) {
                    return [];
                }
            };

            $usuarios = $funcBuscar("SELECT id, nome_completo, email, cbf, tipo_cofre, perfil_id, foto_perfil FROM usuarios ORDER BY id ASC");
            $agendamentos = $funcBuscar("SELECT a.*, u.nome_completo FROM agendamentos a LEFT JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.id DESC");
            $chaves = $funcBuscar("SELECT c.*, u.nome_completo FROM solicitacoes_chave c LEFT JOIN usuarios u ON c.usuario_id = u.id ORDER BY c.id DESC");
            $cartoes = $funcBuscar("SELECT cb.*, u.nome_completo FROM solicitacoes_cartao cb LEFT JOIN usuarios u ON cb.usuario_id = u.id ORDER BY cb.id DESC");
            $emprestimos = $funcBuscar("SELECT e.*, u.nome_completo FROM solicitacoes_emprestimo e LEFT JOIN usuarios u ON e.usuario_id = u.id ORDER BY e.id DESC");

            if ($logger) $logger->registrar($dadosToken['usuario_id'], 'ADMIN_LISTAR_DADOS', "Carregamento dos dados painel executivo.");

            echo json_encode([
                "sucesso" => true,
                "usuarios" => $usuarios,
                "agendamentos" => $agendamentos,
                "chaves" => $chaves,
                "cartoes" => $cartoes,
                "emprestimos" => $emprestimos
            ]);
            break;

        case 'atualizar_status_solicitacao':
            $dadosToken = validarJWT();
            $emailToken = strtolower(trim($dadosToken['email'] ?? ''));
            $eAdmin = (substr($emailToken, -14) === '@gringotts.com');

            if (!$dadosToken || !$eAdmin) {
                http_response_code(403);
                echo json_encode(["erro" => "Acesso restrito aos administradores."]);
                exit();
            }

            $tabela = $dados['tabela'] ?? '';
            $id = $dados['id'] ?? 0;
            $status = $dados['status'] ?? '';

            $tabelasPermitidas = ['agendamentos', 'solicitacoes_chave', 'solicitacoes_cartao', 'solicitacoes_emprestimo'];

            if (!in_array($tabela, $tabelasPermitidas) || !$id || empty($status)) {
                http_response_code(400);
                echo json_encode(["erro" => "Dados ou tabela inválida para atualização."]);
                exit();
            }

            $sql = "UPDATE {$tabela} SET status = :st WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':st' => $status, ':id' => $id]);

            if ($logger) $logger->registrar($dadosToken['usuario_id'], 'ADMIN_STATUS_ALTERADO', "Tabela '{$tabela}' ID #{$id} alterada para '{$status}'.");
            echo json_encode(["mensagem" => "Status atualizado com sucesso!"]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida ou não informada."]);
            break;
    }

} catch (PDOException $e) {
    if (isset($logger) && $logger) $logger->registrar(null, 'ERRO_BANCO_DADOS', $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro no Banco de Dados.",
        "detalhes" => MODO_DEV ? $e->getMessage() : "Consulte os logs do sistema para mais informações."
    ]);
} catch (Throwable $e) {
    if (isset($logger) && $logger) $logger->registrar(null, 'ERRO_SISTEMA_INTERNO', $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro Interno no Servidor.",
        "detalhes" => MODO_DEV ? $e->getMessage() : "Consulte os logs do sistema para mais informações."
    ]);
}