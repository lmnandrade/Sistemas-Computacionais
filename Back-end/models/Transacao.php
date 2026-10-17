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

    public function registrar($usuario_id, $tipo, $descricao, $valor, $moeda = 'galeoes') {
        // Validação rigorosa do nome da coluna da moeda
        $moedasValidas = ['galeoes', 'sicles', 'nuques'];
        $moeda = strtolower(trim($moeda));
        if (!in_array($moeda, $moedasValidas)) {
            $moeda = 'galeoes';
        }

        try {
            $this->conn->beginTransaction();

            // 1. Inserir registo no histórico de transações
            $query = "INSERT INTO " . $this->table_name . " (usuario_id, tipo, descricao, valor, moeda) VALUES (:uid, :tipo, :desc, :val, :moeda)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':uid', $usuario_id);
            $stmt->bindParam(':tipo', $tipo);
            $stmt->bindParam(':desc', $descricao);
            $stmt->bindParam(':val', $valor);
            $stmt->bindParam(':moeda', $moeda);
            $stmt->execute();

            // 2. Atualizar exatamente a coluna da moeda selecionada (galeoes, sicles ou nuques)
            $operacao = ($tipo === 'ENTRADA') ? '+' : '-';
            $querySaldo = "UPDATE usuarios SET " . $moeda . " = COALESCE(" . $moeda . ", 0) " . $operacao . " :val WHERE id = :uid";
            $stmtSaldo = $this->conn->prepare($querySaldo);
            $stmtSaldo->bindParam(':val', $valor);
            $stmtSaldo->bindParam(':uid', $usuario_id);
            $stmtSaldo->execute();

            $this->conn->commit();
            return true;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return false;
        }
    }
}