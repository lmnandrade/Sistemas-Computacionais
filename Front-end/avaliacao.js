document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. RECUPERAÇÃO DA SESSÃO DO USUÁRIO & TOKEN JWT
  // ==========================================
  let usuarioLogado = null;
  const dadosSessao = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("tokenGringotts");

  if (dadosSessao) {
    try {
      usuarioLogado = JSON.parse(dadosSessao);
    } catch (e) {
      console.error("Erro ao carregar dados da sessão do usuário:", e);
    }
  }

  // Helper de URL compatível com Live Server (porta 5500) e Apache
  function obterUrlApi(action) {
    if (window.location.port === "5500" || window.location.hostname === "127.0.0.1") {
      return `http://localhost/Sistemas-Computacionais/Back-end/api.php?action=${action}`;
    }
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  // ==========================================
  // 2. INTERATIVIDADE DO CARTÃO BLACK (cartao.html)
  // ==========================================
  const cartaoBlack = document.querySelector(".cartao-black");
  const cartaoPreview = document.querySelector(".cartao-preview");
  const cartaoTitular = document.querySelector(".cartao-titular");
  const cartaoNumero = document.querySelector(".cartao-numero");
  const btnSolicitar = document.getElementById("btn-solicitar-cartao");

  if (usuarioLogado) {
    if (cartaoTitular && usuarioLogado.nome_completo) {
      cartaoTitular.textContent = usuarioLogado.nome_completo.toUpperCase();
    }
    if (cartaoNumero && usuarioLogado.id) {
      const numCofre = 600 + parseInt(usuarioLogado.id);
      cartaoNumero.textContent = `•••• •••• •••• ${numCofre}`;
    }
  }

  if (cartaoPreview && cartaoBlack) {
    cartaoPreview.addEventListener("mousemove", (e) => {
      const rect = cartaoPreview.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;

      cartaoBlack.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      cartaoBlack.style.transition = "transform 0.1s ease-out";
    });

    cartaoPreview.addEventListener("mouseleave", () => {
      cartaoBlack.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      cartaoBlack.style.transition = "transform 0.5s ease";
    });
  }

  if (btnSolicitar) {
    btnSolicitar.addEventListener("click", (e) => {
      if (!usuarioLogado || !token) {
        const confirmar = confirm("Você precisa estar autenticado no sistema Gringotts para solicitar a avaliação dos Duendes. Deseja fazer login agora?");
        if (confirmar) {
          e.preventDefault();
          window.location.href = "login.html";
        }
      }
    });
  }

  // ==========================================
  // 3. FORMULÁRIO DE AVALIAÇÃO (avaliacao.html)
  // ==========================================
  const formAvaliacao = document.getElementById("form-avaliacao");
  const mensagemResposta = document.getElementById("mensagem-resposta");

  if (formAvaliacao) {
    const inputNomeInicial = document.getElementById("nome-bruxo");
    if (usuarioLogado && inputNomeInicial && usuarioLogado.nome_completo) {
      inputNomeInicial.value = usuarioLogado.nome_completo;
    }

    formAvaliacao.addEventListener("submit", async (e) => {
      e.preventDefault();

      const inputNome = document.getElementById("nome-bruxo");
      const inputRegistro = document.getElementById("registro-ministerio");
      const selectTipoAtivo = document.getElementById("tipo-ativo");

      const nome = inputNome ? inputNome.value.trim() : "";
      const registro = inputRegistro ? inputRegistro.value.trim() : "";
      const criterioElegibilidade = selectTipoAtivo ? selectTipoAtivo.value : "";
      const tipoTexto = selectTipoAtivo && selectTipoAtivo.selectedIndex >= 0
        ? selectTipoAtivo.options[selectTipoAtivo.selectedIndex].text 
        : criterioElegibilidade;

      if (!nome || !registro || !criterioElegibilidade) {
        exibirMensagem("Por favor, preencha todos os campos obrigatórios para análise dos duendes.", "erro");
        return;
      }

      const tokenAtual = localStorage.getItem("tokenGringotts");
      if (!usuarioLogado || !usuarioLogado.id || !tokenAtual) {
        exibirMensagem(
          "Você precisa estar logado para solicitar a avaliação do Cartão Black. <a href='login.html' style='color:#D4AF37; font-weight:bold;'>Faça Login aqui</a>.",
          "erro"
        );
        return;
      }

      const btnSubmeter = formAvaliacao.querySelector("button[type='submit']") || formAvaliacao.querySelector(".btn-dourado");
      let textoOriginalBtn = "";
      if (btnSubmeter) {
        textoOriginalBtn = btnSubmeter.textContent;
        btnSubmeter.disabled = true;
        btnSubmeter.textContent = "Encaminhando Requerimento ao Conselho...";
      }

      const payload = {
        usuario_id: usuarioLogado.id,
        nome_bruxo: nome,
        registro_ministerio: registro,
        criterio_elegibilidade: criterioElegibilidade
      };

      try {
        const response = await fetch(obterUrlApi("solicitar_cartao"), {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenAtual}`
          },
          body: JSON.stringify(payload)
        });

        const textoResposta = await response.text();
        let resultado;
        try {
          resultado = JSON.parse(textoResposta);
        } catch (errJson) {
          console.error("Resposta do PHP não é um JSON válido:", textoResposta);
          exibirMensagem("Erro no servidor: " + textoResposta, "erro");
          return;
        }

        if (response.ok) {
          const protocolo = "PER-" + Math.floor(100000 + Math.random() * 900000);
          const mensagemSucesso = 
            `<strong>REQUERIMENTO PROTOCOLADO SOB Nº ${protocolo}</strong><br><br>` +
            `Prezado(a) <strong>${nome}</strong> (Reg. <em>${registro}</em>), a sua solicitação de perícia para a categoria ` +
            `<strong>"${tipoTexto}"</strong> foi recebida e gravada com sucesso pelo Banco Gringotts.<br><br>` +
            `O prazo estimado para o laudo formal é de até 48 horas úteis.`;

          exibirMensagem(mensagemSucesso, "sucesso");
          formAvaliacao.reset();

          if (usuarioLogado && inputNome) {
            inputNome.value = usuarioLogado.nome_completo || "";
          }
        } else {
          if (response.status === 401) {
            exibirMensagem("Sessão expirada. Por favor, <a href='login.html' style='color:#D4AF37;'>faça login novamente</a>.", "erro");
          } else {
            exibirMensagem(`Erro na solicitação: ${resultado.erro || "Não foi possível registrar seu pedido."}`, "erro");
          }
        }
      } catch (error) {
        console.error("Erro na comunicação com a API:", error);
        exibirMensagem("Erro de comunicação com o servidor Gringotts. Verifique se o XAMPP está ativo.", "erro");
      } finally {
        if (btnSubmeter) {
          btnSubmeter.disabled = false;
          btnSubmeter.textContent = textoOriginalBtn;
        }
      }
    });

    function exibirMensagem(textoHtml, tipo) {
      if (!mensagemResposta) return;
      mensagemResposta.innerHTML = textoHtml;
      mensagemResposta.className = `mensagem-resposta ${tipo}`;
      mensagemResposta.classList.remove("escondido");
      mensagemResposta.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
});