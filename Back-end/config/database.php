<?php
class Database {
    private $host = "localhost";
    private $db_name = "gringotts_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8", $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            http_response_code(500);
            echo json_encode(["erro" => "Erro de conexão com o banco de dados: " . $exception->getMessage()]);
            exit();
        }
        return $this->conn;
    }
}