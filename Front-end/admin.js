document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. VERIFICAÇÃO DE SESSÃO E PERMISSÃO
  // ==========================================
  const dadosSessao = localStorage.getItem("usuarioLogado");

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

  function obterUrlApi(action) {
    if (window.location.port === "5500" || window.location.hostname === "127.0.0.1") {
      return `http://localhost/Sistemas-Computacionais/Back-end/api.php?action=${action}`;
    }
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  let dadosAdmin = {
    usuarios: [],
    agendamentos: [],
    chaves: [],
    cartoes: [],
    emprestimos: []
  };

  let cofreSelecionado = null;

  const totalCofresEl = document.getElementById("totalCofres");
  const visitasPendentesEl = document.getElementById("visitasPendentes");
  const chavesPendentesEl = document.getElementById("chavesPendentes");
  const solicitacoesCreditoEl = document.getElementById("solicitacoesCredito");

  const tabelaUsuarios = document.getElementById("tabelaUsuarios");
  const tabelaAgendamentos = document.getElementById("tabelaAgendamentos");
  const tabelaChaves = document.getElementById("tabelaChaves");
  const tabelaEmprestimos = document.getElementById("tabelaEmprestimos");
  const tabelaCartoes = document.getElementById("tabelaCartoes");

  const inputBusca = document.getElementById("inputBusca");
  const filtroStatus = document.getElementById("filtroStatus");

  const modalDetalhes = document.getElementById("modalDetalhes");
  const modalConteudoCofre = document.getElementById("modalConteudoCofre");
  const modalTituloCofre = document.getElementById("modalTituloCofre");
  const btnFecharModalAdmin = document.getElementById("btnFecharModalAdmin");
  const btnAlternarStatus = document.getElementById("btnAlternarStatus");

  // ==========================================
  // 2. NAVEGAÇÃO ENTRE ABAS (CARDS & BOTÕES)
  // ==========================================
  const botoesAbas = document.querySelectorAll(".btn-aba-admin");
  const conteudosAbas = document.querySelectorAll(".conteudo-aba-admin");
  const elementosNavegacao = document.querySelectorAll("[data-aba]");

  function ativarAba(abaAlvo) {
    botoesAbas.forEach(b => {
      if (b.getAttribute("data-aba") === abaAlvo) {
        b.classList.add("ativa");
      } else {
        b.classList.remove("ativa");
      }
    });

    conteudosAbas.forEach(c => (c.style.display = "none"));

    const elAlvo = document.getElementById(abaAlvo);
    if (elAlvo) {
      elAlvo.style.display = "block";
      elAlvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  elementosNavegacao.forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const abaAlvo = el.getAttribute("data-aba");
      if (abaAlvo) {
        ativarAba(abaAlvo);
      }
    });
  });

  // ==========================================
  // 3. CARREGAMENTO DOS DADOS VIA API
  // ==========================================
  async function carregarDadosAdministrativos() {
    try {
      const response = await fetch(obterUrlApi("listar_dados_admin"));
      const resultado = await response.json();

      if (response.ok && resultado.sucesso) {
        dadosAdmin.usuarios = resultado.usuarios || [];
        dadosAdmin.agendamentos = resultado.agendamentos || [];
        dadosAdmin.chaves = resultado.chaves || [];
        dadosAdmin.cartoes = resultado.cartoes || [];
        dadosAdmin.emprestimos = resultado.emprestimos || [];

        atualizarMetricas();
        renderizarTodasAsTabelas();
      } else {
        console.error("Erro na API de dados admin:", resultado.erro);
      }
    } catch (error) {
      console.error("Erro ao comunicar com a API do Admin:", error);
    }
  }

  // ==========================================
  // 4. ATUALIZAÇÃO DE MÉTRICAS NO TOPO
  // ==========================================
  function atualizarMetricas() {
    if (totalCofresEl) totalCofresEl.textContent = dadosAdmin.usuarios.length;

    const agendamentosPendentes = dadosAdmin.agendamentos.filter(a => (a.status || "PENDENTE") === "PENDENTE").length;
    if (visitasPendentesEl) visitasPendentesEl.textContent = `${agendamentosPendentes} PENDENTES`;

    const chavesPendentes = dadosAdmin.chaves.filter(c => (c.status || "PENDENTE") === "PENDENTE").length;
    if (chavesPendentesEl) chavesPendentesEl.textContent = `${chavesPendentes} PENDENTES`;

    const empPendentes = dadosAdmin.emprestimos.filter(e => (e.status || "PENDENTE") === "PENDENTE").length;
    const cartoesPendentes = dadosAdmin.cartoes.filter(c => (c.status || "PENDENTE") === "PENDENTE").length;
    if (solicitacoesCreditoEl) solicitacoesCreditoEl.textContent = `${empPendentes + cartoesPendentes} ANÁLISES`;
  }

  // ==========================================
  // 5. RENDERIZAÇÃO DAS TABELAS
  // ==========================================
  function renderizarTodasAsTabelas() {
    renderizarTabelaUsuarios();
    renderizarTabelaAgendamentos();
    renderizarTabelaChaves();
    renderizarTabelaEmprestimos();
    renderizarTabelaCartoes();
  }

  function renderizarTabelaUsuarios() {
    if (!tabelaUsuarios) return;

    const termo = (inputBusca?.value || "").toLowerCase();
    const statusSel = filtroStatus?.value || "TODOS";

    const filtrados = dadosAdmin.usuarios.filter(u => {
      const numCofre = 600 + parseInt(u.id);
      const bateTexto = (u.nome_completo || "").toLowerCase().includes(termo) ||
                         (u.email || "").toLowerCase().includes(termo) ||
                         `${numCofre}`.includes(termo);

      const statusUsuario = u.status || "ATIVO";
      const bateStatus = (statusSel === "TODOS") || (statusUsuario === statusSel);
      return bateTexto && bateStatus;
    });

    if (filtrados.length === 0) {
      tabelaUsuarios.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhum cofre localizado na base de dados.</td></tr>`;
      return;
    }

    tabelaUsuarios.innerHTML = filtrados.map(u => {
      const numCofre = 600 + parseInt(u.id);
      const st = u.status || "ATIVO";
      const statusClass = st === "BLOQUEADO" ? "status-bloqueado" : (st === "INSPECAO" ? "status-inspecao" : "status-ativo");

      return `
        <tr>
          <td class="cofre-numero">#${numCofre}-A</td>
          <td><strong>${u.nome_completo || 'Sem Nome'}</strong></td>
          <td>${u.email}</td>
          <td><small style="color:#aaa;">${u.tipo_cofre || 'Bronze Padrão'}</small></td>
          <td>${u.cbf || 'Isento'}</td>
          <td><span class="status-pill ${statusClass}">${st}</span></td>
          <td>
            <button type="button" class="btn-acao-tabela" onclick="inspecionarCofre(${u.id})">⚙️ Gerenciar</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderizarTabelaAgendamentos() {
    if (!tabelaAgendamentos) return;

    if (dadosAdmin.agendamentos.length === 0) {
      tabelaAgendamentos.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhum agendamento registrado.</td></tr>`;
      return;
    }

    tabelaAgendamentos.innerHTML = dadosAdmin.agendamentos.map(a => {
      const st = a.status || "PENDENTE";
      return `
        <tr>
          <td><strong>#AG-${a.id}</strong></td>
          <td>${a.nome_completo || a.nome || 'Visitante'}</td>
          <td><small>${a.email}<br>${a.telefone || ''}</small></td>
          <td><span class="destaque-servico">${a.servico || 'Visita Genérica'}</span></td>
          <td>${a.data_visita || ''} às ${a.horario_visita || ''}</td>
          <td><span class="status-pill ${obterClasseStatus(st)}">${st}</span></td>
          <td>
            <select class="select-status-tabela" onchange="alterarStatusSolicitacao('agendamentos', ${a.id}, this.value)">
              <option value="PENDENTE" ${st === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
              <option value="CONFIRMADO" ${st === 'CONFIRMADO' ? 'selected' : ''}>CONFIRMADO</option>
              <option value="CONCLUIDO" ${st === 'CONCLUIDO' ? 'selected' : ''}>CONCLUÍDO</option>
              <option value="CANCELADO" ${st === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderizarTabelaChaves() {
    if (!tabelaChaves) return;

    if (dadosAdmin.chaves.length === 0) {
      tabelaChaves.innerHTML = `<tr><td colspan="8" class="tabela-vazia">Nenhuma solicitação de chave registrada.</td></tr>`;
      return;
    }

    tabelaChaves.innerHTML = dadosAdmin.chaves.map(c => {
      const st = c.status || "PENDENTE";
      return `
        <tr>
          <td><strong>#CH-${c.id}</strong></td>
          <td><strong>${c.nome_titular}</strong><br><small class="texto-dourado">Cofre #${c.numero_cofre}</small></td>
          <td>${c.registro_ministerio || 'N/I'}</td>
          <td><small>${c.motivo}</small></td>
          <td>${c.tipo_chave || 'Padrão'}</td>
          <td>${c.metodo_retirada || 'Coruja'}</td>
          <td><span class="status-pill ${obterClasseStatus(st)}">${st}</span></td>
          <td>
            <select class="select-status-tabela" onchange="alterarStatusSolicitacao('solicitacoes_chave', ${c.id}, this.value)">
              <option value="PENDENTE" ${st === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
              <option value="EM_ANALISE" ${st === 'EM_ANALISE' ? 'selected' : ''}>EM ANÁLISE</option>
              <option value="APROVADO" ${st === 'APROVADO' ? 'selected' : ''}>APROVADO</option>
              <option value="REJEITADO" ${st === 'REJEITADO' ? 'selected' : ''}>REJEITADO</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderizarTabelaEmprestimos() {
    if (!tabelaEmprestimos) return;

    if (dadosAdmin.emprestimos.length === 0) {
      tabelaEmprestimos.innerHTML = `<tr><td colspan="8" class="tabela-vazia">Nenhuma proposta de empréstimo submetida.</td></tr>`;
      return;
    }

    tabelaEmprestimos.innerHTML = dadosAdmin.emprestimos.map(e => {
      const st = e.status || "PENDENTE";
      return `
        <tr>
          <td><strong>#EMP-${e.id}</strong></td>
          <td>${e.nome_completo || `Usuário #${e.usuario_id}`}</td>
          <td>${e.registro_ministerio || 'N/A'}</td>
          <td><strong class="texto-dourado">${parseInt(e.valor_galeoes).toLocaleString()} Galeões</strong></td>
          <td>${e.prazo_meses} meses</td>
          <td><small>${e.garantia}</small></td>
          <td><span class="status-pill ${obterClasseStatus(st)}">${st}</span></td>
          <td>
            <select class="select-status-tabela" onchange="alterarStatusSolicitacao('solicitacoes_emprestimo', ${e.id}, this.value)">
              <option value="PENDENTE" ${st === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
              <option value="EM_ANALISE" ${st === 'EM_ANALISE' ? 'selected' : ''}>EM ANÁLISE</option>
              <option value="APROVADO" ${st === 'APROVADO' ? 'selected' : ''}>APROVADO</option>
              <option value="RECUSADO" ${st === 'RECUSADO' ? 'selected' : ''}>RECUSADO</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderizarTabelaCartoes() {
    if (!tabelaCartoes) return;

    if (dadosAdmin.cartoes.length === 0) {
      tabelaCartoes.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhuma solicitação de Cartão Black encontrada.</td></tr>`;
      return;
    }

    tabelaCartoes.innerHTML = dadosAdmin.cartoes.map(cb => {
      const st = cb.status || "PENDENTE";
      const dataFormatada = cb.data_solicitacao ? new Date(cb.data_solicitacao).toLocaleDateString("pt-BR") : 'Recente';

      return `
        <tr>
          <td><strong>#CB-${cb.id}</strong></td>
          <td><strong>${cb.nome_bruxo}</strong></td>
          <td>${cb.registro_ministerio || 'N/I'}</td>
          <td><small>${cb.criterio_elegibilidade}</small></td>
          <td><small>${dataFormatada}</small></td>
          <td><span class="status-pill ${obterClasseStatus(st)}">${st}</span></td>
          <td>
            <select class="select-status-tabela" onchange="alterarStatusSolicitacao('solicitacoes_cartao', ${cb.id}, this.value)">
              <option value="PENDENTE" ${st === 'PENDENTE' ? 'selected' : ''}>PENDENTE</option>
              <option value="EM_ANALISE" ${st === 'EM_ANALISE' ? 'selected' : ''}>EM ANÁLISE</option>
              <option value="APROVADO" ${st === 'APROVADO' ? 'selected' : ''}>APROVADO</option>
              <option value="REJEITADO" ${st === 'REJEITADO' ? 'selected' : ''}>REJEITADO</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  }

  function obterClasseStatus(status) {
    switch (status) {
      case "APROVADO":
      case "CONCLUIDO":
      case "CONFIRMADO":
      case "ATIVO":
        return "status-ativo";
      case "EM_ANALISE":
      case "INSPECAO":
      case "PENDENTE":
        return "status-inspecao";
      case "REJEITADO":
      case "RECUSADO":
      case "BLOQUEADO":
      case "CANCELADO":
        return "status-bloqueado";
      default:
        return "status-inspecao";
    }
  }

  window.alterarStatusSolicitacao = async (tabela, id, novoStatus) => {
    try {
      const response = await fetch(obterUrlApi("atualizar_status_solicitacao"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabela, id, status: novoStatus })
      });

      const res = await response.json();
      if (response.ok) {
        carregarDadosAdministrativos();
      } else {
        alert(`Erro ao alterar status: ${res.erro || "Falha na operação."}`);
      }
    } catch (e) {
      console.error("Erro na atualização do status:", e);
      alert("Erro ao comunicar com o banco de dados.");
    }
  };

  window.inspecionarCofre = (id) => {
    cofreSelecionado = dadosAdmin.usuarios.find(u => u.id == id);
    if (!cofreSelecionado) return;

    const numCofre = 600 + parseInt(cofreSelecionado.id);
    modalTituloCofre.textContent = `Gestão do Cofre #${numCofre}-A`;
    const statusAtual = cofreSelecionado.status || "ATIVO";

    modalConteudoCofre.innerHTML = `
      <div class="linha-detalhe"><span>Titular:</span> <strong>${cofreSelecionado.nome_completo || 'N/A'}</strong></div>
      <div class="linha-detalhe"><span>E-mail:</span> <strong>${cofreSelecionado.email}</strong></div>
      <div class="linha-detalhe"><span>CBF Bruxo:</span> <strong>${cofreSelecionado.cbf || 'Isento'}</strong></div>
      <div class="linha-detalhe"><span>Categoria:</span> <strong>${cofreSelecionado.tipo_cofre || 'Bronze'}</strong></div>
      <div class="linha-detalhe"><span>Estado Atual:</span> <strong>${statusAtual}</strong></div>
      <div class="linha-detalhe"><span>Proteção Antidemoníaca:</span> <strong style="color:#2ecc71;">Ativa</strong></div>
    `;

    if (btnAlternarStatus) {
      btnAlternarStatus.textContent = statusAtual === "BLOQUEADO" ? "Desbloquear Cofre" : "Bloquear Cofre";
    }

    if (modalDetalhes) modalDetalhes.style.display = "flex";
  };

  if (btnAlternarStatus) {
    btnAlternarStatus.addEventListener("click", () => {
      if (cofreSelecionado) {
        const novoStatus = (cofreSelecionado.status || "ATIVO") === "BLOQUEADO" ? "ATIVO" : "BLOQUEADO";
        cofreSelecionado.status = novoStatus;
        if (modalDetalhes) modalDetalhes.style.display = "none";
        renderizarTabelaUsuarios();
      }
    });
  }

  if (btnFecharModalAdmin) {
    btnFecharModalAdmin.addEventListener("click", () => {
      if (modalDetalhes) modalDetalhes.style.display = "none";
    });
  }

  if (inputBusca) inputBusca.addEventListener("input", renderizarTabelaUsuarios);
  if (filtroStatus) filtroStatus.addEventListener("change", renderizarTabelaUsuarios);

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      alert("Sessão administrativa encerrada.");
      window.location.href = "login.html";
    });
  }

  carregarDadosAdministrativos();
});