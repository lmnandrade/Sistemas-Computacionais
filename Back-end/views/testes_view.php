<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Testes Automatizados | Banco Gringotts</title>
    <link rel="stylesheet" href="assets/testes.css">
</head>
<body>
    <div class="container">
        <h1>Testes Automatizados Gringotts</h1>

        <div class="summary-box">
            <div class="summary-item">
                <h3>TOTAL DE TESTES</h3>
                <span style="color: #fff;"><?= $totalTestes ?></span>
            </div>
            <div class="summary-item">
                <h3>APROVADOS</h3>
                <span style="color: #2ecc71;"><?= $testesPassaram ?></span>
            </div>
            <div class="summary-item">
                <h3>FALHAS</h3>
                <span style="color: #e74c3c;"><?= $testesFalharam ?></span>
            </div>
        </div>

        <?php foreach ($relatorioResultados as $res): ?>
            <div class="test-card <?= strtolower($res['status']) ?>">
                <div class="test-header">
                    <span class="test-title">#<?= $res['id'] ?>. <?= htmlspecialchars($res['nome']) ?></span>
                    <span class="badge <?= strtolower($res['status']) ?>"><?= $res['status'] ?></span>
                </div>
                <p class="test-desc"><?= htmlspecialchars($res['descricao']) ?></p>
                <div class="test-detail">
                    💡 <strong>Resultado:</strong> <?= htmlspecialchars($res['detalhe']) ?>
                </div>
            </div>
        <?php endforeach; ?>

    </div>
</body>
</html>