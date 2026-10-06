document.addEventListener("DOMContentLoaded", () => {
  const nomeBruxoElemento = document.getElementById("nome-bruxo");
  const btnLogout = document.getElementById("btn-logout");
  const btnExtrato = document.getElementById("btn-extrato");
  const btnTransferencia = document.getElementById("btn-transferencia");

  // Recupera o nome do usuário vindo da URL (?usuario=Nome)
  const urlParams = new URLSearchParams(window.location.search);
  const usuario = urlParams.get("usuario");

  if (usuario) {
    nomeBruxoElemento.textContent = `Bem-vindo(a), ${usuario}`;
  } else {
    nomeBruxoElemento.textContent = "Bem-vindo(a), Bruxo(a)";
  }

  // Encerrar Sessão (retorna para o login)
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      window.location.href = "login.html";
    });
  }

  // Ações secundárias
  if (btnExtrato) {
    btnExtrato.addEventListener("click", () => {
      alert("📜 O extrato completo do cofre foi enviado via Coruja para o seu endereço!");
    });
  }

  if (btnTransferencia) {
    btnTransferencia.addEventListener("click", () => {
      alert("🦉 O serviço de transferência por Coruja estará disponível na próxima lua cheia.");
    });
  }
});