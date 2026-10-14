<?php
class Logger {
    private $conn;
    private $table_name = "logs_sistema";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function registrar($usuario_id, $acao, $detalhes = '') {
        try {
            $query = "INSERT INTO " . $this->table_name . " (usuario_id, acao, detalhes) VALUES (:usuario_id, :acao, :detalhes)";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':usuario_id', $usuario_id);
            $stmt->bindParam(':acao', $acao);
            $stmt->bindParam(':detalhes', $detalhes);
            return $stmt->execute();
        } catch (PDOException $e) {
            return false;
        }
    }
}