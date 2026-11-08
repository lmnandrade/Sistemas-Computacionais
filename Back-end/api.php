<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Conexão com a Base de Dados
require_once __DIR__ . '/config/database.php';

// Inclusão segura de dependências
if (file_exists(__DIR__ . '/models/Usuario.php')) require_once __DIR__ . '/models/Usuario.php';
if (file_exists(__DIR__ . '/models/Transacao.php')) require_once __DIR__ . '/models/Transacao.php';
if (file_exists(__DIR__ . '/models/Logger.php')) require_once __DIR__ . '/models/Logger.php';
if (file_exists(__DIR__ . '/controllers/AuthController.php')) require_once __DIR__ . '/controllers/AuthController.php';
if (file_exists(__DIR__ . '/models/Agendamento.php')) require_once __DIR__ . '/models/Agendamento.php';

try {
    $db = (new Database())->getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro na conexão com o banco de dados: " . $e->getMessage()]);
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
            if ($auth) $auth->cadastro($dados);
            break;

        case 'login':
            if ($auth) $auth->login($dados);
            break;

        case 'get_perfil':
            $usuario_id = $_GET['usuario_id'] ?? $dados['usuario_id'] ?? 0;
            $stmtUser = $db->prepare("SELECT id, nome_completo, email, cbf, galeoes, sicles, nuques, tipo_cofre FROM usuarios WHERE id = :id LIMIT 1");
            $stmtUser->execute([':id' => $usuario_id]);
            $usuarioData = $stmtUser->fetch(PDO::FETCH_ASSOC);

            if ($usuarioData) {
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

            if (class_exists('Transacao')) {
                $transacaoModel = new Transacao($db);
                if ($transacaoModel->registrar($usuario_id, $tipo, $descricao, $valor, $moeda)) {
                    echo json_encode(["mensagem" => "Operação efetuada com sucesso!"]);
                } else {
                    http_response_code(500);
                    echo json_encode(["erro" => "Falha ao processar a movimentação."]);
                }
            }
            break;

        case 'listar_usuarios':
            $stmt = $db->prepare("SELECT id, nome_completo, email, cbf, familia, profissao, tipo_cofre FROM usuarios ORDER BY id ASC");
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

            if (class_exists('Agendamento')) {
                $agendamentoModel = new Agendamento($db);
                if ($agendamentoModel->criar($dados)) {
                    http_response_code(201);
                    echo json_encode(["mensagem" => "Agendamento realizado com sucesso! Os Goblins aguardam sua visita."]);
                } else {
                    http_response_code(500);
                    echo json_encode(["erro" => "Falha ao registrar agendamento na base de dados."]);
                }
            } else {
                $stmt = $db->prepare("INSERT INTO agendamentos (usuario_id, nome, email, telefone, servico, data_visita, horario_visita, status) VALUES (:uid, :nome, :email, :tel, :serv, :dt, :hr, 'PENDENTE')");
                $stmt->execute([
                    ':uid' => $dados['usuario_id'] ?? null,
                    ':nome' => $dados['nome'],
                    ':email' => $dados['email'],
                    ':tel' => $dados['telefone'] ?? '',
                    ':serv' => $dados['servico'],
                    ':dt' => $dados['data_visita'],
                    ':hr' => $dados['horario_visita']
                ]);
                http_response_code(201);
                echo json_encode(["mensagem" => "Agendamento realizado com sucesso!"]);
            }
            break;

        case 'solicitar_chave':
            $usuario_id = $dados['usuario_id'] ?? 0;
            $nome_titular = $dados['nome_titular'] ?? '';
            $numero_cofre = $dados['numero_cofre'] ?? 0;
            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $motivo = $dados['motivo'] ?? '';
            $tipo_chave = $dados['tipo_chave'] ?? '';
            $metodo_retirada = $dados['metodo_retirada'] ?? '';
            $detalhes_incidente = $dados['detalhes_incidente'] ?? '';

            if (!$usuario_id || empty($nome_titular) || !$numero_cofre || empty($motivo)) {
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

            http_response_code(201);
            echo json_encode(["mensagem" => "Solicitação de chave registrada com sucesso!"]);
            break;

        case 'solicitar_cartao':
            $usuario_id = $dados['usuario_id'] ?? 0;
            $nome_bruxo = $dados['nome_bruxo'] ?? '';
            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $criterio_elegibilidade = $dados['criterio_elegibilidade'] ?? '';

            if (!$usuario_id || empty($nome_bruxo) || empty($criterio_elegibilidade)) {
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

            http_response_code(201);
            echo json_encode(["mensagem" => "Pedido de Avaliação do Cartão Black enviado aos duendes!"]);
            break;

        case 'solicitar_emprestimo':
            $usuario_id = $dados['usuario_id'] ?? 0;
            $registro_ministerio = $dados['registro_ministerio'] ?? '';
            $valor_galeoes = $dados['valor_galeoes'] ?? 0;
            $prazo_meses = $dados['prazo_meses'] ?? 12;
            $garantia = $dados['garantia'] ?? 'nenhuma';

            if (!$usuario_id || $valor_galeoes <= 0) {
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

            http_response_code(201);
            echo json_encode(["mensagem" => "Solicitação de empréstimo em Galeões registrada com sucesso!"]);
            break;

        case 'alterar_tipo_cofre':
            $usuario_id = $dados['usuario_id'] ?? 0;
            $tipo_cofre = $dados['tipo_cofre'] ?? '';

            if (!$usuario_id || empty($tipo_cofre)) {
                http_response_code(400);
                echo json_encode(["erro" => "Parâmetros inválidos."]);
                exit();
            }

            $sql = "UPDATE usuarios SET tipo_cofre = :tipo WHERE id = :uid";
            $stmt = $db->prepare($sql);
            $stmt->execute([':tipo' => $tipo_cofre, ':uid' => $usuario_id]);
            echo json_encode(["mensagem" => "Categoria do cofre atualizada com sucesso!"]);
            break;

        case 'listar_dados_admin':
            $funcBuscar = function($sql) use ($db) {
                try {
                    $stmt = $db->query($sql);
                    return $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
                } catch (Exception $e) {
                    return [];
                }
            };

            $usuarios = $funcBuscar("SELECT id, nome_completo, email, cbf, tipo_cofre, perfil_id FROM usuarios ORDER BY id ASC");
            $agendamentos = $funcBuscar("SELECT a.*, u.nome_completo FROM agendamentos a LEFT JOIN usuarios u ON a.usuario_id = u.id ORDER BY a.id DESC");
            $chaves = $funcBuscar("SELECT c.*, u.nome_completo FROM solicitacoes_chave c LEFT JOIN usuarios u ON c.usuario_id = u.id ORDER BY c.id DESC");
            $cartoes = $funcBuscar("SELECT cb.*, u.nome_completo FROM solicitacoes_cartao cb LEFT JOIN usuarios u ON cb.usuario_id = u.id ORDER BY cb.id DESC");
            $emprestimos = $funcBuscar("SELECT e.*, u.nome_completo FROM solicitacoes_emprestimo e LEFT JOIN usuarios u ON e.usuario_id = u.id ORDER BY e.id DESC");

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
            echo json_encode(["mensagem" => "Status atualizado com sucesso!"]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["erro" => "Ação inválida ou não informada."]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro no Banco de Dados: " . $e->getMessage()]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro Interno: " . $e->getMessage()]);
}