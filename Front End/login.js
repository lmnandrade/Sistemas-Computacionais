document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.querySelector(".form-login");
  const campoUsuario = document.getElementById("usuario");
  const campoSenha = document.getElementById("senha");
  const container = document.querySelector(".login-container");

  if (formLogin) {
    formLogin.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuario = campoUsuario.value.trim();
      const senha = campoSenha.value;

      removerMensagem();

      // Validações no Front-end
      if (usuario.length < 3) {
        exibirMensagem("O nome de bruxo/usuário deve conter pelo menos 3 caracteres.", "erro");
        campoUsuario.focus();
        return;
      }

      if (senha.length < 6) {
        exibirMensagem("A chave de acesso deve conter no mínimo 6 caracteres.", "erro");
        campoSenha.focus();
        return;
      }

      // Feedback visual
      const btnSubmit = formLogin.querySelector(".btn-entrar");
      btnSubmit.disabled = true;
      btnSubmit.textContent = "VERIFICANDO CHAVE...";

      setTimeout(() => {
        formLogin.style.display = "none";
        
        exibirMensagem(
          `🔑 <strong>Acesso Concedido!</strong><br><br>` +
          `Acessando os cofres de <strong>${usuario}</strong>...`,
          "sucesso"
        );

        // Redireciona passando o nome via parâmetro na URL
        setTimeout(() => {
          window.location.href = `perfil.html?usuario=${encodeURIComponent(usuario)}`;
        }, 1200);
      }, 1000);
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