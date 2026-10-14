<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Logger.php';

class AuthController {
    private $db;
    private $usuario;
    private $logger;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->usuario = new Usuario($this->db);
        $this->logger = new Logger($this->db);
    }

    public function cadastro($dados) {
        if (empty($dados['nomeCompleto']) || empty($dados['email']) || empty($dados['cbf']) || empty($dados['senha'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Preencha todos os campos obrigatórios (incluindo E-mail)."]);
            return;
        }

        $this->usuario->nome_completo = $dados['nomeCompleto'];
        $this->usuario->email = strtolower(trim($dados['email']));
        $this->usuario->familia = $dados['familia'] ?? '';
        $this->usuario->cbf = $dados['cbf'];
        $this->usuario->rg = $dados['rg'] ?? '';
        $this->usuario->data_nascimento = !empty($dados['dataNascimento']) ? $dados['dataNascimento'] : null;
        $this->usuario->sexo = $dados['sexo'] ?? '';
        $this->usuario->profissao = $dados['profissao'] ?? '';
        $this->usuario->senha = $dados['senha'];

        // Define perfil: 2 = ADM (se for @gringotts.com), 1 = Cliente (outros domínios)
        if (str_ends_with($this->usuario->email, '@gringotts.com')) {
            $this->usuario->perfil_id = 2; // Administrador
        } else {
            $this->usuario->perfil_id = 1; // Cliente
        }

        if ($this->usuario->emailExiste()) {
            http_response_code(400);
            echo json_encode(["erro" => "Este e-mail já está registado no sistema."]);
            return;
        }

        if ($this->usuario->cbfExiste()) {
            http_response_code(400);
            echo json_encode(["erro" => "CBF já cadastrado no sistema."]);
            return;
        }

        if ($this->usuario->cadastrar()) {
            if ($this->logger) {
                $this->logger->registrar($this->usuario->id, "CADASTRO", "Usuário cadastrado com sucesso.");
            }
            http_response_code(201);
            echo json_encode(["mensagem" => "Solicitação de abertura de cofre aprovada com sucesso!"]);
        } else {
            http_response_code(500);
            echo json_encode(["erro" => "Erro ao gravar o utilizador na base de dados."]);
        }
    }

    public function login($dados) {
        $loginInput = $dados['email'] ?? $dados['cbf'] ?? $dados['login'] ?? '';

        if (empty($loginInput) || empty($dados['senha'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Informe o E-mail/CBF e a palavra-passe."]);
            return;
        }

        $user = $this->usuario->login($loginInput, $dados['senha']);
        if ($user) {
            $emailUser = strtolower($user['email'] ?? '');
            
            // Redireciona para admin.html se o email terminar em @gringotts.com ou se o perfil_id for 2
            $paginaDestino = (str_ends_with($emailUser, '@gringotts.com') || ($user['perfil_id'] == 2))
                ? 'admin.html' 
                : 'perfil.html';

            http_response_code(200);
            echo json_encode([
                "mensagem" => "Login efetuado com sucesso!",
                "redirecionarPara" => $paginaDestino,
                "usuario" => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["erro" => "E-mail/CBF ou palavra-passe incorretos."]);
        }
    }
}