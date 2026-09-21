document.addEventListener("DOMContentLoaded", () => {
  const formChave = document.getElementById("form-chave");
  const mensagemResposta = document.getElementById("mensagem-resposta");

  if (!formChave) return;

  formChave.addEventListener("submit", (event) => {
    event.preventDefault();

    // Coleta dos dados do formulário
    const nome = document.getElementById("nome-titular").value.trim();
    const numeroCofre = document.getElementById("numero-cofre").value.trim();
    const registro = document.getElementById("registro-ministerio").value.trim();
    const motivo = document.getElementById("motivo-solicitacao").value;
    const tipoChaveSelect = document.getElementById("tipo-chave");
    const tipoChaveTexto = tipoChaveSelect.options[tipoChaveSelect.selectedIndex].text;
    const metodoRetiradaSelect = document.getElementById("metodo-retirada");
    const metodoRetiradaTexto = metodoRetiradaSelect.options[metodoRetiradaSelect.selectedIndex].text;

    // Validação básica adicional
    if (!nome || !numeroCofre || !registro || !motivo) {
      exibirMensagem(
        "Por favor, preencha todos os campos obrigatórios para o registro mágico do formulário.",
        "erro"
      );
      return;
    }

    // Efeito de envio / Animação temática
    const btnSubmeter = formChave.querySelector(".btn-submeter");
    const textoOriginalBtn = btnSubmeter.textContent;
    btnSubmeter.disabled = true;
    btnSubmeter.textContent = "Neutralizando Molde & Iniciando Forja...";

    setTimeout(() => {
      // Reabilita o botão
      btnSubmeter.disabled = false;
      btnSubmeter.textContent = textoOriginalBtn;

      // Monta a mensagem de confirmação no estilo Gringotts
      const mensagemSucesso = `
        <strong>🗝️ Requerimento Aprovado pelo Conselho!</strong><br><br>
        Prezado(a) <strong>${nome}</strong>, o processo de revogação mágica da chave antiga do <strong>Cofre nº ${numeroCofre}</strong> foi ativado com sucesso.<br><br>
        <strong>Detalhes da Solicitação:</strong><br>
        • <em>Material:</em> ${tipoChaveTexto}<br>
        • <em>Entrega:</em> ${metodoRetiradaTexto}<br>
        • <em>Protocolo:</em> GRG-KEY-${Math.floor(100000 + Math.random() * 900000)}<br><br>
        A taxa de forja será debitada diretamente no saldo do seu cofre no momento da entrega da nova chave.
      `;

      exibirMensagem(mensagemSucesso, "sucesso");

      // Limpa os campos do formulário
      formChave.reset();
    }, 1500);
  });

  /**
   * Exibe a caixa de feedback ao usuário
   * @param {string} textoHtml - O conteúdo da mensagem
   * @param {string} tipo - 'sucesso' ou 'erro'
   */
  function exibirMensagem(textoHtml, tipo) {
    mensagemResposta.innerHTML = textoHtml;
    mensagemResposta.className = `mensagem-resposta ${tipo}`;
    mensagemResposta.classList.remove("escondido");

    // Rola a página até a mensagem
    mensagemResposta.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});