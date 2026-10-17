<?php
class Transacao {
    private $conn;
    private $table_name = "transacoes";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function buscarPorUsuario($usuario_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE usuario_id = :uid ORDER BY data_transacao DESC LIMIT 10";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':uid', $usuario_id);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function registrar($usuario_id, $tipo, $descricao, $valor) {
        try {
            $this->conn->beginTransaction();

            // 1. Inserir registo na tabela de transações
            $query = "INSERT INTO " . $this->table_name . " (usuario_id, tipo, descricao, valor) VALUES (:uid, :tipo, :desc, :val)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':uid', $usuario_id);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':desc', $descricao);
            $stmt->bindParam(':val', $valor);
            $stmt->execute();

            // 2. Atualizar o saldo de Galeões do utilizador
            $operacao = ($tipo === 'ENTRADA') ? '+' : '-';
            $querySaldo = "UPDATE usuarios SET galeoes = galeoes " . $operacao . " :val WHERE id = :uid";
            $stmtSaldo = $this->conn->prepare($querySaldo);
            $stmtSaldo->bindParam(':val', $valor);
            $stmtSaldo->bindParam(':uid', $usuario_id);
            $stmtSaldo->execute();

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
}
