document.addEventListener("DOMContentLoaded", () => {
  const dadosSessao = localStorage.getItem("usuarioLogado");

  // 1. Verificação de Acesso
  if (!dadosSessao) {
    alert("Acesso negado! Faça login primeiro.");
    window.location.href = "login.html";
    return;
  }

  const usuarioLogado = JSON.parse(dadosSessao);
  const emailUser = (usuarioLogado.email || "").toLowerCase();
  const eAdmin = emailUser.endsWith("@gringotts.com") || usuarioLogado.perfil_id == 2;

  if (!eAdmin) {
    alert("Acesso restrito aos administradores do Banco Gringotts.");
    window.location.href = "perfil.html";
    return;
  }

  const elementoNome = document.getElementById("nomeAdmin");
  if (elementoNome) {
    elementoNome.textContent = `Supervisor(a) ${usuarioLogado.nome_completo || usuarioLogado.email}`;
  }

  let listaCofres = [];
  let cofreSelecionado = null;

  const tabelaUsuarios = document.getElementById("tabelaUsuarios");
  const inputBusca = document.getElementById("inputBusca");
  const filtroStatus = document.getElementById("filtroStatus");
  const totalCofresEl = document.getElementById("totalCofres");
  const modalDetalhes = document.getElementById("modalDetalhes");
  const modalConteudoCofre = document.getElementById("modalConteudoCofre");
  const modalTituloCofre = document.getElementById("modalTituloCofre");
  const btnFecharModalAdmin = document.getElementById("btnFecharModalAdmin");
  const btnAlternarStatus = document.getElementById("btnAlternarStatus");

  // 2. Carregar dados operacionais sincronizados com a base de dados
  async function carregarDadosGestao() {
    try {
      const response = await fetch("http://localhost/Sistemas-Computacionais/Back-end/api.php?action=listar_usuarios");
      const dados = await response.json();

      if (response.ok && dados.usuarios && dados.usuarios.length > 0) {
        listaCofres = dados.usuarios.map(u => {
          const numCofre = 600 + parseInt(u.id);
          const ehAdmin = (u.email || "").toLowerCase().endsWith("@gringotts.com");
          
          return {
            id: u.id,
            nome: u.nome_completo || u.email,
            email: u.email,
            cbf: u.cbf || "Isento",
            nivelSeguranca: ehAdmin ? "Nível 1 - Alta Diretoria" : `Nível ${numCofre} - Família ${u.familia || 'Bruxa'}`,
            status: "ATIVO",
            ultimaAtividade: "Sincronizado"
          };
        });
      } else {
        // Fallback para a conta ativa se a lista retornar vazia
        listaCofres = [{
          id: usuarioLogado.id || 1,
          nome: usuarioLogado.nome_completo || "Diretoria de Goblins",
          email: usuarioLogado.email,
          cbf: usuarioLogado.cbf || "Isento",
          nivelSeguranca: "Nível 1 - Alta Diretoria",
          status: "ATIVO",
          ultimaAtividade: "Hoje"
        }];
      }

      renderizarTabelaGerencial();
    } catch (error) {
      console.error("Erro de comunicação com o servidor:", error);
    }
  }

  // 3. Renderizar Tabela Gerencial
  function renderizarTabelaGerencial() {
    if (totalCofresEl) totalCofresEl.textContent = listaCofres.length;

    const termo = (inputBusca?.value || "").toLowerCase();
    const statusSel = filtroStatus?.value || "TODOS";

    const filtrados = listaCofres.filter(c => {
      const bateTexto = (c.nome || "").toLowerCase().includes(termo) ||
                         (c.email || "").toLowerCase().includes(termo) ||
                         `600-${c.id}`.includes(termo);

      const bateStatus = (statusSel === "TODOS") || (c.status === statusSel);

      return bateTexto && bateStatus;
    });

    if (!tabelaUsuarios) return;

    if (filtrados.length === 0) {
      tabelaUsuarios.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">Nenhum cofre localizado na base de dados.</td></tr>`;
      return;
    }

    tabelaUsuarios.innerHTML = filtrados.map(c => {
      const numCofre = 600 + parseInt(c.id);
      let statusClass = "status-ativo";
      let statusTexto = "PROTEGIDO / ATIVO";

      if (c.status === "BLOQUEADO") {
        statusClass = "status-bloqueado";
        statusTexto = "TRANCADO / BLOQUEADO";
      } else if (c.status === "INSPECAO") {
        statusClass = "status-inspecao";
        statusTexto = "SOB INSPEÇÃO";
      }

      return `
        <tr>
          <td class="cofre-numero">#${numCofre}-A</td>
          <td><strong>${c.nome}</strong></td>
          <td>${c.email}</td>
          <td><small style="color:#aaa;">${c.nivelSeguranca}</small></td>
          <td><span class="status-pill ${statusClass}">${statusTexto}</span></td>
          <td><small>${c.ultimaAtividade}</small></td>
          <td>
            <button class="btn-acao-tabela" onclick="inspecionarCofre(${c.id})">
              ⚙️ Gerenciar
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // 4. Inspecionar e alterar estado do cofre
  window.inspecionarCofre = (id) => {
    cofreSelecionado = listaCofres.find(c => c.id == id);
    if (!cofreSelecionado) return;

    const numCofre = 600 + parseInt(cofreSelecionado.id);
    modalTituloCofre.textContent = `Gestão do Cofre #${numCofre}-A`;
    
    modalConteudoCofre.innerHTML = `
      <div class="linha-detalhe"><span>Titular:</span> <strong>${cofreSelecionado.nome}</strong></div>
      <div class="linha-detalhe"><span>E-mail:</span> <strong>${cofreSelecionado.email}</strong></div>
      <div class="linha-detalhe"><span>CBF Bruxo:</span> <strong>${cofreSelecionado.cbf}</strong></div>
      <div class="linha-detalhe"><span>Nível de Segurança:</span> <strong>${cofreSelecionado.nivelSeguranca}</strong></div>
      <div class="linha-detalhe"><span>Estado Atual:</span> <strong>${cofreSelecionado.status}</strong></div>
      <div class="linha-detalhe"><span>Barreira de Proteção:</span> <strong style="color:#2ecc71;">Feitiços Antidemoníacos Ativos</strong></div>
    `;

    btnAlternarStatus.textContent = cofreSelecionado.status === "BLOQUEADO" ? "Desbloquear Cofre" : "Bloquear Cofre";
    modalDetalhes.style.display = "flex";
  };

  if (btnAlternarStatus) {
    btnAlternarStatus.addEventListener("click", () => {
      if (cofreSelecionado) {
        cofreSelecionado.status = cofreSelecionado.status === "BLOQUEADO" ? "ATIVO" : "BLOQUEADO";
        alert(`O estado do Cofre #${600 + parseInt(cofreSelecionado.id)}-A foi alterado para: ${cofreSelecionado.status}`);
        modalDetalhes.style.display = "none";
        renderizarTabelaGerencial();
      }
    });
  }

  if (btnFecharModalAdmin) {
    btnFecharModalAdmin.addEventListener("click", () => {
      modalDetalhes.style.display = "none";
    });
  }

  // Filtros
  if (inputBusca) inputBusca.addEventListener("input", renderizarTabelaGerencial);
  if (filtroStatus) filtroStatus.addEventListener("change", renderizarTabelaGerencial);

  // Logout
  const btnLogout = document.getElementById("btn-logout") || document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      alert("Sessão administrativa encerrada.");
      window.location.href = "login.html";
    });
  }

  carregarDadosGestao();
});