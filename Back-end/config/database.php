<?php
// Carrega as variáveis de ambiente do arquivo .env
require_once __DIR__ . '/env.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host     = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? 'localhost';
        $this->db_name  = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'gringotts';
        $this->username = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';
    }

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            throw new Exception("Erro na conexão com o banco de dados: " . $exception->getMessage());
        }

        return $this->conn;
    }
}