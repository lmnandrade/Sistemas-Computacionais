<?php
class Logger {
    private $conn;
    private $table_name = "logs_sistema";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($usuario_id, $acao, $detalhes = '') {
        try {
            // Converte arrays ou objetos em JSON para guardar nos detalhes
            if (is_array($detalhes) || is_object($detalhes)) {
                $detalhes = json_encode($detalhes, JSON_UNESCAPED_UNICODE);
            }

            // Define o nível do log conforme a ação
            $nivel = 'INFO';
            if (strpos($acao, 'FALHA') !== false || strpos($acao, 'ERRO') !== false || strpos($acao, 'NEGADO') !== false) {
                $nivel = 'WARNING';
            }

            // Anexa o ID do utilizador nos detalhes
            $infoUsuario = (!empty($usuario_id)) ? "[User ID: {$usuario_id}] " : "[Visitante/Sistema] ";
            $detalhesFinal = $infoUsuario . $detalhes;

            // Query mapeada exatamente para a sua tabela: nivel, mensagem, detalhes, criado_em
            $query = "INSERT INTO " . $this->table_name . " (nivel, mensagem, detalhes, criado_em) VALUES (:nivel, :mensagem, :detalhes, NOW())";
            $stmt = $this->conn->prepare($query);

            $stmt->bindValue(':nivel', $nivel);
            $stmt->bindValue(':mensagem', $acao);
            $stmt->bindValue(':detalhes', trim($detalhesFinal));

            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Erro no Logger: " . $e->getMessage());
            return false;
        }
    }
}