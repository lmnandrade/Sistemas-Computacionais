<?php
class Agendamento {
    private $conn;
    private $table_name = "agendamentos";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function criar($dados) {
        $query = "INSERT INTO " . $this->table_name . " 
            (usuario_id, nome, email, telefone, servico, num_cofre, data_visita, horario_visita, observacoes) 
            VALUES (:usuario_id, :nome, :email, :telefone, :servico, :num_cofre, :data_visita, :horario_visita, :observacoes)";

        $stmt = $this->conn->prepare($query);

        // Trata usuario_id (pode ser NULL para visitantes não registados)
        $usuario_id = !empty($dados['usuario_id']) ? (int)$dados['usuario_id'] : null;

        $stmt->bindParam(':usuario_id', $usuario_id, is_null($usuario_id) ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindParam(':nome', $dados['nome']);
        $stmt->bindParam(':email', $dados['email']);
        $stmt->bindParam(':telefone', $dados['telefone']);
        $stmt->bindParam(':servico', $dados['servico']);
        $stmt->bindParam(':num_cofre', $dados['num_cofre']);
        $stmt->bindParam(':data_visita', $dados['data_visita']);
        $stmt->bindParam(':horario_visita', $dados['horario_visita']);
        $stmt->bindParam(':observacoes', $dados['observacoes']);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }
}