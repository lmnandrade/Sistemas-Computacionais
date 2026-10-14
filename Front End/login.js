document.addEventListener("DOMContentLoaded", () => {
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

      // Validações no Front-end
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

      // Feedback visual do botão
      const btnSubmit = formLogin.querySelector(".btn-entrar");
      btnSubmit.disabled = true;
      const textoOriginal = btnSubmit.textContent;
      btnSubmit.textContent = "VERIFICANDO CHAVE...";

      try {
        const response = await fetch("http://localhost/Sistemas-Computacionais/Back-end/api.php?action=login", {
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

        if (response.ok) {
          // Guarda os dados da sessão no navegador
          localStorage.setItem("usuarioLogado", JSON.stringify(resultado.usuario));

          formLogin.style.display = "none";
          
          exibirMensagem(
            `🔑 <strong>Acesso Concedido!</strong><br><br>` +
            `Acessando os cofres de <strong>${resultado.usuario.nome_completo || usuario}</strong>...`,
            "sucesso"
          );

          // Redireciona dinamicamente para a página devolvida pelo PHP (admin.html ou perfil.html)
          setTimeout(() => {
            window.location.href = resultado.redirecionarPara || "perfil.html";
          }, 1200);

        } else {
          // Reativa o botão em caso de erro
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
