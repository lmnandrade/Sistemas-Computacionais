

```markdown
# Documentação Oficial da API - Banco Gringotts

API RESTful desenvolvida em PHP com arquitetura stateless, autenticação JWT (*JSON Web Tokens*), acesso a dados com PDO e logs de auditoria.

---

## Informações Gerais

* **Base URL:** `http://localhost/Sistemas-Computacionais/Back-end/api.php`
* **Formato de Envio/Resposta:** `JSON` (`Content-Type: application/json`)
* **Autenticação de Rotas Protegidas:** Cabeçalho HTTP `Authorization: Bearer <TOKEN_JWT>`

---

## Códigos de Status HTTP Utilizados

| Código | Significado | Descrição |
| :--- | :--- | :--- |
| `200 OK` | Sucesso | Requisição processada com sucesso. |
| `201 Created` | Criado | Novo registro criado no banco de dados. |
| `400 Bad Request` | Requisição Inválida | Parâmetros obrigatórios ausentes ou inválidos. |
| `401 Unauthorized` | Não Autorizado | Credenciais incorretas, token ausente ou expirado. |
| `403 Forbidden` | Acesso Proibido | Usuário autenticado sem perfil de Administrador. |
| `404 Not Found` | Não Encontrado | Registro solicitados não localizado. |
| `500 Internal Error` | Erro no Servidor | Falha na execução do código backend ou banco de dados. |

---

## 1. Endpoints Públicos

### 1.1 Cadastro de Usuário
* **URL:** `/api.php?action=cadastro`
* **Método HTTP:** `POST`
* **Cabeçalhos:** `Content-Type: application/json`
* **Parâmetros no Corpo:**
  ```json
  {
  "nomeCompleto": "Draco Lucius Malfoy",
  "email": "draco.malfoy@gmail.com",
  "senha": "@Senha123",
  "cbf": "444.444.444-44",
  "rg": "55.555.555-5",
  "dataNascimento": "1980-06-05",
  "familia": "Malfoy",
  "profissao": "Auror",
  "foto": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAgEASABIAAD..."
  }