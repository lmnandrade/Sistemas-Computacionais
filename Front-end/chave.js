document.addEventListener("DOMContentLoaded", () => {
  const formChave = document.getElementById("form-chave");
  const mensagemResposta = document.getElementById("mensagem-resposta");

  if (!formChave) return;

  // Helper de URL compatível com Live Server (porta 5500) e Apache
  function obterUrlApi(action) {
    if (window.location.port === "5500" || window.location.hostname === "127.0.0.1") {
      return `http://localhost/Sistemas-Computacionais/Back-end/api.php?action=${action}`;
    }
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  // 1. Preenchimento automático e verificação de sessão/token JWT
  let usuarioLogado = null;
  const dadosSessao = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("tokenGringotts");

  if (dadosSessao) {
    try {
      usuarioLogado = JSON.parse(dadosSessao);
      const inputNome = document.getElementById("nome-titular");
      const inputCofre = document.getElementById("numero-cofre");

      if (inputNome && usuarioLogado.nome_completo) {
        inputNome.value = usuarioLogado.nome_completo;
      }
      if (inputCofre && usuarioLogado.id) {
        inputCofre.value = 600 + parseInt(usuarioLogado.id);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da sessão:", e);
    }
  }

  // 2. Submissão do formulário com integração à API e JWT
  formChave.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Coleta dos dados do formulário
    const nome = document.getElementById("nome-titular").value.trim();
    const numeroCofre = document.getElementById("numero-cofre").value.trim();
    const registro = document.getElementById("registro-ministerio").value.trim();
    const motivoSelect = document.getElementById("motivo-solicitacao");
    const motivo = motivoSelect.value;
    const tipoChaveSelect = document.getElementById("tipo-chave");
    const tipoChave = tipoChaveSelect.value;
    const tipoChaveTexto = tipoChaveSelect.options[tipoChaveSelect.selectedIndex]?.text || tipoChave;
    const metodoRetiradaSelect = document.getElementById("metodo-retirada");
    const metodoRetirada = metodoRetiradaSelect.value;
    const metodoRetiradaTexto = metodoRetiradaSelect.options[metodoRetiradaSelect.selectedIndex]?.text || metodoRetirada;
    const detalhesIncidente = document.getElementById("detalhes-incidente") 
      ? document.getElementById("detalhes-incidente").value.trim() 
      : "";

    // Validação básica dos campos do formulário
    if (!nome || !numeroCofre || !registro || !motivo || !tipoChave || !metodoRetirada) {
      exibirMensagem(
        "Por favor, preencha todos os campos obrigatórios para o registro mágico do formulário.",
        "erro"
      );
      return;
    }

    // Validação de autenticação via JWT
    const tokenAtual = localStorage.getItem("tokenGringotts");
    if (!tokenAtual || !usuarioLogado || !usuarioLogado.id) {
      exibirMensagem(
        "Sessão não identificada ou expirada. <a href='login.html' style='color:#D4AF37; font-weight:bold;'>Faça Login aqui</a> para solicitar a 2ª via da chave.",
        "erro"
      );
      return;
    }

    // Feedback visual e efeito de envio
    const btnSubmeter = formChave.querySelector(".btn-submeter");
    const textoOriginalBtn = btnSubmeter.textContent;
    btnSubmeter.disabled = true;
    btnSubmeter.textContent = "Neutralizando Molde & Iniciando Forja...";

    // Estrutura dos dados para a API
    const payload = {
      usuario_id: usuarioLogado.id,
      nome_titular: nome,
      numero_cofre: parseInt(numeroCofre),
      registro_ministerio: registro,
      motivo: motivo,
      tipo_chave: tipoChave,
      metodo_retirada: metodoRetirada,
      detalhes_incidente: detalhesIncidente
    };

    try {
      const response = await fetch(obterUrlApi("solicitar_chave"), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenAtual}`
        },
        body: JSON.stringify(payload)
      });

      const resultado = await response.json();

      if (response.ok) {
        const mensagemSucesso = `
          <strong>🗝️ Requerimento Aprovado pelo Conselho!</strong><br><br>
          Prezado(a) <strong>${nome}</strong>, o processo de revogação mágica da chave antiga do <strong>Cofre nº ${numeroCofre}</strong> foi ativado com sucesso.<br><br>
          <strong>Detalhes da Solicitação:</strong><br>
          • <em>Material:</em> ${tipoChaveTexto}<br>
          • <em>Entrega:</em> ${metodoRetiradaTexto}<br>
          • <em>Protocolo:</em> GRG-KEY-${Math.floor(100000 + Math.random() * 900000)}<br><br>
          ${resultado.mensagem || "A taxa de forja será debitada diretamente no saldo do seu cofre no momento da entrega da nova chave."}
        `;

        exibirMensagem(mensagemSucesso, "sucesso");
        formChave.reset();

        // Restaura o autopreenchimento após reset
        if (usuarioLogado) {
          if (document.getElementById("nome-titular")) document.getElementById("nome-titular").value = usuarioLogado.nome_completo || "";
          if (document.getElementById("numero-cofre")) document.getElementById("numero-cofre").value = 600 + parseInt(usuarioLogado.id);
        }
      } else {
        if (response.status === 401) {
          exibirMensagem("Sessão expirada. Por favor, <a href='login.html' style='color:#D4AF37;'>faça login novamente</a>.", "erro");
        } else {
          exibirMensagem(`Erro na solicitação: ${resultado.erro || "Falha ao registrar o pedido com os duendes."}`, "erro");
        }
      }
    } catch (error) {
      console.error("Erro na comunicação com o servidor:", error);
      exibirMensagem("Erro de comunicação com o servidor Gringotts. Certifique-se de que o Apache e MySQL estão rodando no XAMPP.", "erro");
    } finally {
      btnSubmeter.disabled = false;
      btnSubmeter.textContent = textoOriginalBtn;
    }
  });

  /**
   * Exibe a caixa de feedback ao usuário
   * @param {string} textoHtml O conteúdo da mensagem
   * @param {string} tipo 'sucesso' ou 'erro'
   */
  function exibirMensagem(textoHtml, tipo) {
    mensagemResposta.innerHTML = textoHtml;
    mensagemResposta.className = `mensagem-resposta ${tipo}`;
    mensagemResposta.classList.remove("escondido");

    mensagemResposta.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});