document.addEventListener("DOMContentLoaded", () => {
  const dadosSessao = localStorage.getItem("usuarioLogado");

  // 1. Verificação de Acesso (Redireciona se não estiver logado)
  if (!dadosSessao) {
    alert("Acesso negado! Faça login primeiro.");
    window.location.href = "login.html";
    return;
  }

  const usuario = JSON.parse(dadosSessao);
  const emailUser = (usuario.email || "").toLowerCase();

  // 2. Proteção de Rota: Apenas emails @gringotts.com ou perfil_id 2 entram no Admin
  const eAdmin = emailUser.endsWith("@gringotts.com") || usuario.perfil_id == 2;

  if (!eAdmin) {
    alert("Acesso restrito aos administradores do Banco Gringotts.");
    window.location.href = "perfil.html";
    return;
  }

  // 3. Preenche as informações na tela
  const elementoNome = document.getElementById("nomeAdmin");
  if (elementoNome) {
    elementoNome.textContent = usuario.nome_completo || usuario.email;
  }

  // 4. Renderiza os dados do utilizador logado na tabela
  const tabela = document.getElementById("tabelaUsuarios");
  if (tabela) {
    tabela.innerHTML = `
      <tr>
        <td>#${usuario.id || 1}</td>
        <td><strong>${usuario.nome_completo || "Administrador"}</strong></td>
        <td>${usuario.email}</td>
        <td>${usuario.cbf || "Isento"}</td>
        <td><span class="tag-perfil tag-admin">ADMINISTRADOR</span></td>
      </tr>
    `;
  }

  // 5. Botão de Encerramento de Sessão (Logout)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      alert("Sessão encerrada com sucesso.");
      window.location.href = "login.html";
    });
  }
});