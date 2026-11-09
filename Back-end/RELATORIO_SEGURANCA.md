# Relatório de Evidências de Segurança e Proteções - Banco Gringotts

Este documento atesta e demonstra as proteções implementadas contra vulnerabilidades web e o controle de acesso do sistema Banco Gringotts.

---

## 1. Proteção contra SQL Injection (SQLi)
* **Mecanismo:** Todo o acesso e manipulação de dados no backend é realizado estritamente através de **PDO com Prepared Statements** (`PDO::prepare()`, `bindValue()`, `bindParam()`). Nenhuma variável externa é concatenada em queries SQL.
* **Evidência no Código (`Back-end/api.php`):**
  ```php
  $stmt =$db->prepare("SELECT * FROM usuarios WHERE TRIM(email) = :email OR TRIM(cbf) = :email LIMIT 1");
  $stmt->execute([':email' =>$email]);