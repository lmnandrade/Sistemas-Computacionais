document.addEventListener("DOMContentLoaded", () => {
  // Validação estritamente baseada no sufixo de e-mail @gringotts.com
  function verificarSeEhAdmin(usuario) {
    if (!usuario || !usuario.email) return false;
    const emailUser = String(usuario.email).trim().toLowerCase();
    return emailUser.endsWith("@gringotts.com");
  }

  function obterUrlApi(action) {
    if (window.location.port === "5500" || window.location.hostname === "127.0.0.1") {
      return `http://localhost/Sistemas-Computacionais/Back-end/api.php?action=${action}`;
    }
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  // 1. VERIFICA SE JÁ EXISTE SESSÃO E TOKEN ATIVOS
  const dadosSessao = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("tokenGringotts");

  if (dadosSessao && token) {
    try {
      const usuario = JSON.parse(dadosSessao);
      const eAdmin = verificarSeEhAdmin(usuario);

      window.location.href = eAdmin ? "admin.html" : "perfil.html";
      return;
    } catch (e) {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("tokenGringotts");
    }
  }

  // 2. ELEMENTOS DO FORMULÁRIO DE LOGIN
  const formLogin = document.querySelector(".form-login");
  const campoUsuario = document.getElementById("usuario");
  const campoSenha = document.getElementById("senha");
  const container = document.querySelector(".login-container");

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();

      const usuario = campoUsuario.value.trim();
      const senha = campoSenha.value;

      removerMensagem();

      if (usuario.length < 3) {
        exibirMensagem("Informe um e-mail ou CBF válido.", "erro");
        campoUsuario.focus();
        return;
      }

      if (senha.length < 6) {
        exibirMensagem("A chave de acesso deve conter no mínimo 6 caracteres.", "erro");
        campoSenha.focus();
        return;
      }

      const btnSubmit = formLogin.querySelector(".btn-entrar");
      btnSubmit.disabled = true;
      const textoOriginal = btnSubmit.textContent;
      btnSubmit.textContent = "VERIFICANDO CHAVE...";

      try {
        const response = await fetch(obterUrlApi("login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: usuario,
            senha: senha
          })
        });

        const resultado = await response.json();

        if (response.ok && resultado.sucesso) {
          localStorage.setItem("tokenGringotts", resultado.token);
          localStorage.setItem("usuarioLogado", JSON.stringify(resultado.usuario));

          formLogin.style.display = "none";

          exibirMensagem(
            `🔑 <strong>Acesso Concedido!</strong><br><br>` +
            `Acessando os cofres de <strong>${resultado.usuario.nome_completo || usuario}</strong>...`,
            "sucesso"
          );

          const eAdmin = verificarSeEhAdmin(resultado.usuario);
          const destino = eAdmin ? "admin.html" : "perfil.html";

          setTimeout(() => {
            window.location.href = destino;
          }, 1200);

        } else {
          btnSubmit.disabled = false;
          btnSubmit.textContent = textoOriginal;
          exibirMensagem(resultado.erro || "E-mail ou palavra-passe incorretos.", "erro");
        }
      } catch (error) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
        exibirMensagem("Falha de comunicação com o servidor: " + error.message, "erro");
      }
    });
  }

  function removerMensagem() {
    const msgAntiga = document.querySelector(".mensagem-login");
    if (msgAntiga) {
      msgAntiga.remove();
    }
  }

  function exibirMensagem(textoHTML, tipo) {
    removerMensagem();

    const divMensagem = document.createElement("div");
    divMensagem.className = `mensagem-login ${tipo}`;
    divMensagem.innerHTML = textoHTML;

    container.insertBefore(divMensagem, formLogin);
  }
});