document.addEventListener("DOMContentLoaded", () => {
  const formEmprestimo = document.getElementById("form-emprestimo");
  const inputValor = document.getElementById("valor-galeoes");
  const selectPrazo = document.getElementById("prazo-pagamento");
  const selectGarantia = document.getElementById("garantia-cofre");
  const resultadoParcela = document.getElementById("resultado-parcela");
  const resultadoTotal = document.getElementById("resultado-total");
  const mensagemResposta = document.getElementById("mensagem-resposta");
  const inputRegistro = document.getElementById("registro-ministerio");

  // ==========================================
  // 1. VERIFICAÇÃO DE SESSÃO DO USUÁRIO
  // ==========================================
  let usuarioLogado = null;
  const dadosSessao = localStorage.getItem("usuarioLogado");

  if (dadosSessao) {
    try {
      usuarioLogado = JSON.parse(dadosSessao);
    } catch (e) {
      console.error("Erro ao carregar dados da sessão do usuário:", e);
    }
  }

  // Função para ajustar o caminho do api.php dinamicamente
  function obterUrlApi(action) {
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  // ==========================================
  // 2. CÁLCULO REATIVO DO EMPRÉSTIMO
  // ==========================================
  function calcularEmprestimo() {
    if (!inputValor || !selectPrazo || !selectGarantia) return;

    const valor = parseFloat(inputValor.value) || 0;
    const prazo = parseInt(selectPrazo.value) || 12;
    const garantia = selectGarantia.value;

    if (valor <= 0) {
      if (resultadoParcela) resultadoParcela.textContent = "0 Gál / lua";
      if (resultadoTotal) resultadoTotal.textContent = "0 Galeões";
      return;
    }

    // Definir taxa anual baseada na garantia
    let taxaAnual = 0.05; // 5% ao ano padrão
    if (garantia === "cofre") taxaAnual = 0.025;
    if (garantia === "artefato") taxaAnual = 0.03;

    const taxaMensal = taxaAnual / 12;
    const totalComJuros = valor * (1 + taxaMensal * prazo);
    const parcela = totalComJuros / prazo;

    if (resultadoParcela) resultadoParcela.textContent = `${Math.ceil(parcela)} Gál / lua`;
    if (resultadoTotal) resultadoTotal.textContent = `${Math.ceil(totalComJuros)} Galeões`;
  }

  // Recalcula em tempo real nos eventos de entrada do usuário
  if (inputValor) inputValor.addEventListener("input", calcularEmprestimo);
  if (selectPrazo) selectPrazo.addEventListener("change", calcularEmprestimo);
  if (selectGarantia) selectGarantia.addEventListener("change", calcularEmprestimo);

  // Executa o cálculo inicial para renderizar os valores zerados/padrão
  calcularEmprestimo();

  // ==========================================
  // 3. SUBMISSÃO DA SOLICITAÇÃO (INTEGRAÇÃO API)
  // ==========================================
  if (formEmprestimo) {
    formEmprestimo.addEventListener("submit", async (e) => {
      e.preventDefault();

      const registro = inputRegistro ? inputRegistro.value.trim() : "";
      const valor = inputValor ? parseFloat(inputValor.value) : 0;
      const prazo = selectPrazo ? parseInt(selectPrazo.value) : 12;
      const garantia = selectGarantia ? selectGarantia.value : "nenhuma";

      // Validação básica dos campos
      if (!registro || valor <= 0) {
        exibirMensagem("Por favor, informe um registro válido do Ministério da Magia e um valor superior a 0 Galeões.", "erro");
        return;
      }

      // Validação de autenticação
      if (!usuarioLogado || !usuarioLogado.id) {
        exibirMensagem(
          "Você precisa estar logado para solicitar um empréstimo. <a href='login.html' style='color:#D4AF37; font-weight:bold;'>Faça Login aqui</a>.",
          "erro"
        );
        return;
      }

      // Feedback visual no botão de envio
      const btnSubmeter = formEmprestimo.querySelector("button[type='submit']") || formEmprestimo.querySelector(".btn-solicitar");
      let textoOriginalBtn = "";
      if (btnSubmeter) {
        textoOriginalBtn = btnSubmeter.textContent;
        btnSubmeter.disabled = true;
        btnSubmeter.textContent = "A avaliar proposta com a Gestão de Duendes...";
      }

      const payload = {
        usuario_id: usuarioLogado.id,
        registro_ministerio: registro,
        valor_galeoes: valor,
        prazo_meses: prazo,
        garantia: garantia
      };

      try {
        const response = await fetch(obterUrlApi("solicitar_emprestimo"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (response.ok) {
          const mensagemSucesso = 
            `📜 <strong>Solicitação Registrada com Sucesso!</strong><br><br>` +
            `Sua proposta de empréstimo no valor de <strong>${valor} Galeões</strong> (Registro: <em>${registro}</em>) ` +
            `foi enviada e gravada para avaliação técnica do Conselho de Duendes.<br>` +
            `Uma coruja com o selo de aprovação chegará ao seu endereço em até 24 horas.`;

          exibirMensagem(mensagemSucesso, "sucesso");
          formEmprestimo.reset();
          calcularEmprestimo();
        } else {
          exibirMensagem(`Erro no requerimento: ${resultado.erro || "Não foi possível registrar a proposta de empréstimo."}`, "erro");
        }
      } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        exibirMensagem("Erro de comunicação com o servidor Gringotts. Verifique se o XAMPP está ativo.", "erro");
      } finally {
        if (btnSubmeter) {
          btnSubmeter.disabled = false;
          btnSubmeter.textContent = textoOriginalBtn;
        }
      }
    });
  }

  /**
   * Exibe mensagens de feedback formatadas ao usuário
   */
  function exibirMensagem(textoHtml, tipo) {
    if (!mensagemResposta) return;
    mensagemResposta.innerHTML = textoHtml;
    mensagemResposta.className = `mensagem-resposta ${tipo}`;
    mensagemResposta.classList.remove("escondido");
    mensagemResposta.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
});