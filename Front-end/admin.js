document.addEventListener("DOMContentLoaded", () => {
  function verificarSeEhAdmin(usuario) {
    if (!usuario || !usuario.email) return false;
    const emailUser = String(usuario.email).trim().toLowerCase();
    return emailUser.endsWith("@gringotts.com") || emailUser.includes("@gringotts.com");
  }

  // 1. VERIFICAÇÃO DE SESSÃO E PERMISSÃO (JWT)
  const dadosSessao = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("tokenGringotts");

  if (!dadosSessao || !token) {
    alert("Acesso negado ou sessão expirada! Faça login primeiro.");
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tokenGringotts");
    window.location.href = "login.html";
    return;
  }

  let usuarioLogado = JSON.parse(dadosSessao);
  const eAdmin = verificarSeEhAdmin(usuarioLogado);

  if (!eAdmin) {
    alert("Acesso restrito aos administradores do Banco Gringotts.");
    window.location.href = "perfil.html";
    return;
  }

  const elementoNome = document.getElementById("nomeAdmin");
  if (elementoNome) {
    elementoNome.textContent = `Supervisor(a) ${usuarioLogado.nome_completo || usuarioLogado.email}`;
  }

  // Elementos do Avatar e Foto do Administrador
  const imgAvatarAdmin = document.getElementById("img-avatar-admin");
  const emojiAvatarAdmin = document.getElementById("emoji-avatar-admin");
  const containerAvatarAdmin = document.getElementById("avatar-admin-box") || document.querySelector(".avatar-bruxo");

  function renderizarFotoAdmin(fotoUrl) {
    const temFoto = fotoUrl && String(fotoUrl).trim().length > 50;

    if (imgAvatarAdmin) {
      if (temFoto) {
        imgAvatarAdmin.src = fotoUrl;
        imgAvatarAdmin.style.display = "block";
        if (emojiAvatarAdmin) emojiAvatarAdmin.style.display = "none";
      } else {
        imgAvatarAdmin.style.display = "none";
        if (emojiAvatarAdmin) emojiAvatarAdmin.style.display = "inline";
      }
      return;
    }

    if (containerAvatarAdmin) {
      if (temFoto) {
        containerAvatarAdmin.innerHTML = `<img src="${fotoUrl}" alt="Foto do Diretor" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
      } else {
        containerAvatarAdmin.innerHTML = `<span style="font-size: 2.5rem;">👺</span>`;
      }
    }
  }

  renderizarFotoAdmin(usuarioLogado.foto_perfil);

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

  // Elementos do Modal de Edição do Admin
  const modalEditarPerfil = document.getElementById("modal-editar-perfil");
  const btnAbrirModalPerfil = document.getElementById("btn-abrir-modal-perfil");
  const btnFecharModalPerfil = document.getElementById("btn-fechar-modal-perfil");
  const formEditarPerfil = document.getElementById("form-editar-perfil");
  const inputFotoFile = document.getElementById("input-foto-file");
  const previewFotoPerfil = document.getElementById("preview-foto-perfil");
  const previewEmojiFoto = document.getElementById("preview-emoji-foto");
  const editNomeCompleto = document.getElementById("edit-nome-completo");
  const editFamilia = document.getElementById("edit-familia");
  const editProfissao = document.getElementById("edit-profissao");

  let fotoBase64 = usuarioLogado.foto_perfil || "";

  // 2. LÓGICA DE EDIÇÃO DE DADOS E FOTO DO ADMIN
  if (btnAbrirModalPerfil) {
    btnAbrirModalPerfil.addEventListener("click", () => {
      const u = usuarioLogado;
      if (editNomeCompleto) editNomeCompleto.value = u.nome_completo || "";
      if (editFamilia) editFamilia.value = u.familia || "";
      if (editProfissao) editProfissao.value = u.profissao || "";

      fotoBase64 = u.foto_perfil || "";
      if (fotoBase64 && fotoBase64.length > 50) {
        if (previewFotoPerfil) {
          previewFotoPerfil.src = fotoBase64;
          previewFotoPerfil.style.display = "block";
        }
        if (previewEmojiFoto) previewEmojiFoto.style.display = "none";
      } else {
        if (previewFotoPerfil) previewFotoPerfil.style.display = "none";
        if (previewEmojiFoto) previewEmojiFoto.style.display = "inline";
      }

      if (modalEditarPerfil) modalEditarPerfil.style.display = "flex";
    });
  }

  if (btnFecharModalPerfil) {
    btnFecharModalPerfil.addEventListener("click", () => {
      if (modalEditarPerfil) modalEditarPerfil.style.display = "none";
    });
  }

  if (inputFotoFile) {
    inputFotoFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          alert("A imagem selecionada deve ter no máximo 2MB.");
          inputFotoFile.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          fotoBase64 = evt.target.result;
          if (previewFotoPerfil) {
            previewFotoPerfil.src = fotoBase64;
            previewFotoPerfil.style.display = "block";
          }
          if (previewEmojiFoto) previewEmojiFoto.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (formEditarPerfil) {
    formEditarPerfil.addEventListener("submit", async (e) => {
      e.preventDefault();
      const tokenAtual = localStorage.getItem("tokenGringotts");
      const dadosAtualizados = {
        nome_completo: editNomeCompleto ? editNomeCompleto.value.trim() : "",
        familia: editFamilia ? editFamilia.value.trim() : "",
        profissao: editProfissao ? editProfissao.value.trim() : "",
        foto_perfil: fotoBase64
      };

      try {
        const response = await fetch(obterUrlApi("atualizar_perfil"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenAtual}`
          },
          body: JSON.stringify(dadosAtualizados)
        });

        const resultado = await response.json();

        if (response.ok && resultado.sucesso) {
          alert(resultado.mensagem || "Perfil atualizado com sucesso!");
          if (resultado.usuario) {
            localStorage.setItem("usuarioLogado", JSON.stringify(resultado.usuario));
            usuarioLogado = resultado.usuario;
          }
          if (elementoNome) {
            elementoNome.textContent = `Supervisor(a) ${usuarioLogado.nome_completo || usuarioLogado.email}`;
          }
          renderizarFotoAdmin(usuarioLogado.foto_perfil);
          if (modalEditarPerfil) modalEditarPerfil.style.display = "none";
        } else {
          alert("Erro: " + (resultado.erro || "Falha ao atualizar dados."));
        }
      } catch (err) {
        alert("Erro de comunicação: " + err.message);
      }
    });
  }

  // 3. NAVEGAÇÃO ENTRE ABAS
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

  // 4. CARREGAMENTO DOS DADOS VIA API
  async function carregarDadosAdministrativos() {
    try {
      const tokenAtual = localStorage.getItem("tokenGringotts");

      const response = await fetch(obterUrlApi("listar_dados_admin"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenAtual}`
        }
      });

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
        if (response.status === 401 || response.status === 403) {
          alert("Sessão expirada ou não autorizada. Faça login novamente.");
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("tokenGringotts");
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Erro ao comunicar com a API do Admin:", error);
    }
  }

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

      const temFoto = u.foto_perfil && String(u.foto_perfil).trim().length > 50;
      const avatarHtml = temFoto 
        ? `<img src="${u.foto_perfil}" style="width:28px; height:28px; border-radius:50%; object-fit:cover; vertical-align:middle; margin-right:8px; border:1px solid #d4af37;" />`
        : `<span style="margin-right:8px;">🧙‍♂️</span>`;

      return `
        <tr>
          <td class="cofre-numero">#${numCofre}-A</td>
          <td>${avatarHtml}<strong>${u.nome_completo || 'Sem Nome'}</strong></td>
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
      const tokenAtual = localStorage.getItem("tokenGringotts");
      const response = await fetch(obterUrlApi("atualizar_status_solicitacao"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenAtual}`
        },
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

    const temFoto = cofreSelecionado.foto_perfil && String(cofreSelecionado.foto_perfil).trim().length > 50;
    const fotoHtml = temFoto 
      ? `<div style="text-align:center; margin-bottom:15px;"><img src="${cofreSelecionado.foto_perfil}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #d4af37;" /></div>`
      : '';

    modalConteudoCofre.innerHTML = `
      ${fotoHtml}
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
      localStorage.removeItem("tokenGringotts");
      alert("Sessão administrativa encerrada.");
      window.location.href = "login.html";
    });
  }

  window.alterarSenhaUsuario = async function () {
    const senhaAtual = prompt("Digite a sua senha atual:");
    if (!senhaAtual) return;

    const novaSenha = prompt("Digite a nova senha (deve ter mais de 6 caracteres, incluir maiúsculas, minúsculas, números e especial):");
    if (!novaSenha) return;

    if (novaSenha.length <= 6) {
      alert("Erro: A nova senha deve ter mais de 6 caracteres.");
      return;
    }
    if (!/[0-9]/.test(novaSenha) || !/[a-z]/.test(novaSenha) || !/[A-Z]/.test(novaSenha) || !/[^A-Za-z0-9]/.test(novaSenha)) {
      alert("Erro: A nova senha deve conter números, letras maiúsculas, minúsculas e caractere especial (ex: @, #, $).");
      return;
    }

    const confirmaSenha = prompt("Confirme a nova senha:");
    if (novaSenha !== confirmaSenha) {
      alert("Erro: A confirmação de senha não confere.");
      return;
    }

    try {
      const tokenAtual = localStorage.getItem("tokenGringotts");
      const response = await fetch(obterUrlApi("alterar_senha"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenAtual}`
        },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha
        })
      });

      const res = await response.json();
      if (response.ok && res.sucesso) {
        alert(res.mensagem || "Senha alterada com sucesso!");
      } else {
        alert("Erro ao alterar senha: " + (res.erro || "Falha na operação."));
      }
    } catch (err) {
      alert("Erro de comunicação com o servidor: " + err.message);
    }
  };

  carregarDadosAdministrativos();
});