<?php
class Usuario {
    private $conn;
    private $table_name = "usuarios";

    public $id;
    public $nome_completo;
    public $email;
    public $familia;
    public $cbf;
    public $rg;
    public $data_nascimento;
    public $sexo;
    public $profissao;
    public $senha;
    public $perfil_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function cbfExiste() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE cbf = :cbf LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':cbf', $this->cbf);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function emailExiste() {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $this->email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function cadastrar() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nome_completo, email, familia, cbf, rg, data_nascimento, sexo, profissao, senha_hash, perfil_id) 
                  VALUES (:nome, :email, :familia, :cbf, :rg, :data_nascimento, :sexo, :profissao, :senha_hash, :perfil_id)";

        $stmt = $this->conn->prepare($query);

        $senha_hash = password_hash($this->senha, PASSWORD_DEFAULT);

        $stmt->bindParam(':nome', $this->nome_completo);
        $stmt->bindParam(':email', $this->email);
        $stmt->bindParam(':familia', $this->familia);
        $stmt->bindParam(':cbf', $this->cbf);
        $stmt->bindParam(':rg', $this->rg);
        $stmt->bindParam(':data_nascimento', $this->data_nascimento);
        $stmt->bindParam(':sexo', $this->sexo);
        $stmt->bindParam(':profissao', $this->profissao);
        $stmt->bindParam(':senha_hash', $senha_hash);
        $stmt->bindParam(':perfil_id', $this->perfil_id);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function login($login, $senha) {
        // Permite efetuar login usando o E-mail ou o CBF
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = :login OR cbf = :login LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':login', $login);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (password_verify($senha, $row['senha_hash'])) {
                unset($row['senha_hash']);
                return $row;
            }
        }
        return false;
    }
}