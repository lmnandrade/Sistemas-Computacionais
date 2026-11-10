<?php
function carregarEnv($caminho) {
    if (!file_exists($caminho)) return;
    $linhas = file($caminho, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($linhas as $linha) {
        if (strpos(trim($linha), '#') === 0) continue;
        if (strpos($linha, '=') !== false) {
            list($chave, $valor) = explode('=', $linha, 2);
            $chave = trim($chave);
            $valor = trim($valor);
            $_ENV[$chave] = $valor;
            putenv("{$chave}={$valor}");
        }
    }
}

// Carrega o arquivo .env da raiz do backend
carregarEnv(__DIR__ . '/../.env');