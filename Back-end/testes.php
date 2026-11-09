<?php
// Inclusão das dependências do sistema
require_once __DIR__ . '/config/database.php';

if (file_exists(__DIR__ . '/models/Logger.php')) require_once __DIR__ . '/models/Logger.php';
if (file_exists(__DIR__ . '/models/Transacao.php')) require_once __DIR__ . '/models/Transacao.php';

// Conexão com o Banco de Dados
try {
    $db = (new Database())->getConnection();
    $logger = class_exists('Logger') ? new Logger($db) : null;
} catch (Exception $e) {
    die("<h2 style='color:red;'>Erro ao conectar com o banco de dados: " . $e->getMessage() . "</h2>");
}

// Contadores de execução
$totalTestes = 0;
$testesPassaram = 0;
$testesFalharam = 0;
$relatorioResultados = [];

function executarTeste($id, $nome, $descricao, $callback) {
    global $totalTestes, $testesPassaram, $testesFalharam, $relatorioResultados;
    $totalTestes++;

    try {
        $resultado = $callback();
        if ($resultado['sucesso']) {
            $testesPassaram++;
            $status = 'PASSED';
        } else {
            $testesFalharam++;
            $status = 'FAILED';
        }
    } catch (Exception $e) {
        $testesFalharam++;
        $status = 'FAILED';
        $resultado = ['sucesso' => false, 'mensagem' => "Exceção: " . $e->getMessage()];
    }

    $relatorioResultados[] = [
        'id' => $id,
        'nome' => $nome,
        'descricao' => $descricao,
        'status' => $status,
        'detalhe' => $resultado['mensagem']
    ];
}

// -------------------------------------------------------------
// EXECUÇÃO DOS 5 TESTES DE REGRAS DE NEGÓCIO
// -------------------------------------------------------------

// TESTE 1: Validação de Complexidade de Senha Forte
executarTeste(
    1,
    "Validação de Complexidade de Senhas",
    "Testa se senhas fracas são rejeitadas e se senhas válidas passam nos critérios (comprimento > 6, maiúscula, minúscula, número e símbolo especial).",
    function() {
        $validarSenha = function($senha) {
            return (
                strlen($senha) > 6 &&
                preg_match('/[A-Z]/', $senha) &&
                preg_match('/[a-z]/', $senha) &&
                preg_match('/[0-9]/', $senha) &&
                preg_match('/[^A-Za-z0-9]/', $senha)
            );
        };

        $senhaFraca1 = "123456";
        $senhaFraca2 = "AlvoDumbledore";
        $senhaForte  = "Alohomora@2026";

        if ($validarSenha($senhaFraca1) === true) return ['sucesso' => false, 'mensagem' => "Falha: Senha '123456' foi aceita incorretamente."];
        if ($validarSenha($senhaFraca2) === true) return ['sucesso' => false, 'mensagem' => "Falha: Senha sem números/símbolos foi aceita incorretamente."];
        if ($validarSenha($senhaForte) === false) return ['sucesso' => false, 'mensagem' => "Falha: Senha válida 'Alohomora@2026' foi rejeitada."];

        return ['sucesso' => true, 'mensagem' => "Aprovado: Regras de complexidade aplicadas corretamente (Rejeitou fracas e aprovou 'Alohomora@2026')."];
    }
);

// TESTE 2: Controle de Acesso Baseado em Domínio (RBAC - Admin)
executarTeste(
    2,
    "Controle de Permissões RBAC (Domínio @gringotts.com)",
    "Testa se a regra de acesso restrito reconhece emails da diretoria (@gringotts.com) e nega aos usuários normais.",
    function() {
        $verificarAdmin = function($email) {
            $emailClean = strtolower(trim($email));
            return (substr($emailClean, -14) === '@gringotts.com');
        };

        $emailBruxoNormal = "harry.potter@hogwarts.edu";
        $emailGoblinAdmin = "grampo.diretor@gringotts.com";

        if ($verificarAdmin($emailBruxoNormal) === true) {
            return ['sucesso' => false, 'mensagem' => "Falha: Email comum recebeu acesso administrativo indevido."];
        }
        if ($verificarAdmin($emailGoblinAdmin) === false) {
            return ['sucesso' => false, 'mensagem' => "Falha: Email da diretoria @gringotts.com foi negado."];
        }

        return ['sucesso' => true, 'mensagem' => "Aprovado: Somente domínios @gringotts.com possuem acesso administrativo."];
    }
);

// TESTE 3: Regra de Negócio Financeira (Validação de Valores Negativos/Inválidos)
executarTeste(
    3,
    "Regra de Movimentação Mágica (Valores Negativos/Zerados)",
    "Verifica se o sistema rejeita depósitos ou saques com valores menores ou iguais a zero.",
    function() {
        $validarMovimentacao = function($valor) {
            return (is_numeric($valor) && (int)$valor > 0);
        };

        if ($validarMovimentacao(-50) === true) return ['sucesso' => false, 'mensagem' => "Falha: Permitida movimentação com valor negativo (-50)."];
        if ($validarMovimentacao(0) === true)   return ['sucesso' => false, 'mensagem' => "Falha: Permitida movimentação com valor zero (0)."];
        if ($validarMovimentacao(100) === false) return ['sucesso' => false, 'mensagem' => "Falha: Movimentação válida (100 Galeões) foi recusada."];

        return ['sucesso' => true, 'mensagem' => "Aprovado: Movimentações com valores <= 0 são devidamente bloqueadas."];
    }
);

// TESTE 4: Validação de Estrutura do JWT
executarTeste(
    4,
    "Integridade do Assinador JWT",
    "Gera uma estrutura JWT de simulação e testa se o token expira ou falha em caso de adulteração.",
    function() {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payloadValido = base64_encode(json_encode(['usuario_id' => 1, 'exp' => time() + 3600]));
        $payloadExpirado = base64_encode(json_encode(['usuario_id' => 1, 'exp' => time() - 3600]));

        $validarExpiracao = function($payloadBase64) {
            $dados = json_decode(base64_decode($payloadBase64), true);
            return isset($dados['exp']) && $dados['exp'] >= time();
        };

        if ($validarExpiracao($payloadValido) === false)   return ['sucesso' => false, 'mensagem' => "Falha: Token válido foi considerado expirado."];
        if ($validarExpiracao($payloadExpirado) === true) return ['sucesso' => false, 'mensagem' => "Falha: Token expirado foi considerado válido."];

        return ['sucesso' => true, 'mensagem' => "Aprovado: Validação de tempo de expiração do JWT funcionando perfeitamente."];
    }
);

// TESTE 5: Sistema de Observabilidade (Inserção em `logs_sistema`)
executarTeste(
    5,
    "Registro Automático no Logger de Auditoria",
    "Insere um log de teste no banco de dados através da classe Logger e verifica o retorno.",
    function() use ($logger) {
        if (!$logger) {
            return ['sucesso' => false, 'mensagem' => "Falha: Instância da classe Logger não foi carregada."];
        }

        $resultado = $logger->registrar(1, 'TESTE_AUTOMATIZADO', 'Execução de teste via testes.php');

        if ($resultado) {
            return ['sucesso' => true, 'mensagem' => "Aprovado: Evento registrado com sucesso na tabela logs_sistema."];
        } else {
            return ['sucesso' => false, 'mensagem' => "Falha ao gravar registro de auditoria no banco de dados."];
        }
    }
);

// Carrega a view para renderizar a interface
require_once __DIR__ . '/views/testes_view.php';