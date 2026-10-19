document.addEventListener("DOMContentLoaded", () => {
  const dadosSessao = localStorage.getItem("usuarioLogado");

  // Procura botões/links de login no cabeçalho
  const linksLogin = document.querySelectorAll('a[href="login.html"], .btn-login, #btn-login-nav');

  if (dadosSessao) {
    try {
      const usuario = JSON.parse(dadosSessao);
      const emailUser = (usuario.email || "").toLowerCase();
      const eAdmin = emailUser.endsWith("@gringotts.com") || usuario.perfil_id == 2;
      const destino = eAdmin ? "admin.html" : "perfil.html";
      const textoBotao = eAdmin ? "Painel do Diretor 🛡️" : "Meu Perfil 🧙‍♂️";

      linksLogin.forEach(link => {
        link.href = destino;
        link.textContent = textoBotao;
        link.classList.add("btn-perfil-ativo");
      });
    } catch (e) {
      console.error("Erro ao ler sessão:", e);
    }
  }
});