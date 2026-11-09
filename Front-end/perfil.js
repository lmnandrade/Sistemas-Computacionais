document.addEventListener("DOMContentLoaded", () => {
  // Trava para evitar que administradores fiquem na tela de perfil
  function verificarSeEhAdmin(usuario) {
    if (!usuario || !usuario.email) return false;
    const emailUser = String(usuario.email).trim().toLowerCase();
    return emailUser.endsWith("@gringotts.com") || emailUser.includes("@gringotts.com");
  }

  const dadosSessao = localStorage.getItem("usuarioLogado");
  const token = localStorage.getItem("tokenGringotts");

  if (!dadosSessao || !token) {
    alert("Sessão não encontrada ou expirada. Faça login novamente.");
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tokenGringotts");
    window.location.href = "login.html";
    return;
  }

  let usuarioSessao = null;
  try {
    usuarioSessao = JSON.parse(dadosSessao);
  } catch (e) {
    localStorage.removeItem("usuarioLogado");
    localStorage.removeItem("tokenGringotts");
    window.location.href = "login.html";
    return;
  }

  // Redireciona para admin.html se o usuário for administrador
  if (verificarSeEhAdmin(usuarioSessao)) {
    window.location.href = "admin.html";
    return;
  }

  let saldoOculto = false;

  function obterUrlApi(action) {
    if (window.location.port === "5500" || window.location.hostname === "127.0.0.1") {
      return `http://localhost/Sistemas-Computacionais/Back-end/api.php?action=${action}`;
    }
    return window.location.pathname.includes("/Front-end/")
      ? `../Back-end/api.php?action=${action}`
      : `Back-end/api.php?action=${action}`;
  }

  // Elementos da Página Principal
  const nomeBruxoElemento = document.getElementById("nome-bruxo");
  const numCofreElemento = document.getElementById("num-cofre-id");
  const planoAtualElemento = document.getElementById("plano-atual") || document.getElementById("planoAtual") || document.getElementById("tipo-cofre-texto");
  const saldoGaleoes = document.getElementById("saldo-galeoes");
  const saldoSicles = document.getElementById("saldo-sicles");
  const saldoNuques = document.getElementById("saldo-nuques");
  const listaHistorico = document.getElementById("lista-historico");
  const btnToggleSaldo = document.getElementById("btn-toggle-saldo");
  const btnLogout = document.getElementById("btn-logout");

  // Elementos da Categoria / Nível do Cofre
  const seletorTipoCofre = document.getElementById("seletorTipoCofre");
  const btnSalvarTipoCofre = document.getElementById("btnSalvarTipoCofre");

  // Elementos do Avatar / Foto de Perfil
  const containerAvatar = document.querySelector(".avatar-bruxo") || document.getElementById("avatar-bruxo-box");
  const imgAvatarBruxo = document.getElementById("img-avatar-bruxo");
  const emojiAvatarBruxo = document.getElementById("emoji-avatar-bruxo");

  // Elementos do Modal de Operações (Depósito/Saída)
  const modal = document.getElementById("modal-operacao");
  const modalTitulo = document.getElementById("modal-titulo");
  const formOperacao = document.getElementById("form-operacao");
  const opTipo = document.getElementById("op-tipo");
  const btnDepositar = document.getElementById("btn-depositar");
  const btnRetirar = document.getElementById("btn-retirar");
  const btnFecharModal = document.getElementById("btn-fechar-modal");

  // Elementos do Modal de Edição de Perfil
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

  let fotoBase64 = "";

  // Renderiza a foto no elemento de avatar da página principal
  function renderizarFotoPerfil(fotoUrl) {
    const temFoto = fotoUrl && String(fotoUrl).trim() !== "";

    if (imgAvatarBruxo) {
      if (temFoto) {
        imgAvatarBruxo.src = fotoUrl;
        imgAvatarBruxo.style.display = "block";
        if (emojiAvatarBruxo) emojiAvatarBruxo.style.display = "none";
      } else {
        imgAvatarBruxo.style.display = "none";
        if (emojiAvatarBruxo) emojiAvatarBruxo.style.display = "inline";
      }
      return;
    }

    if (containerAvatar) {
      if (temFoto) {
        containerAvatar.innerHTML = `<img id="img-avatar-bruxo" src="${fotoUrl}" alt="Foto do Bruxo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" />`;
      } else {
        containerAvatar.innerHTML = `<span id="emoji-avatar-bruxo" style="font-size: 2.5rem;">🧙‍♂️</span>`;
      }
    }
  }

  async function carregarPerfil() {
    try {
      const tokenAtual = localStorage.getItem("tokenGringotts");

      const response = await fetch(`${obterUrlApi("get_perfil")}&usuario_id=${usuarioSessao.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokenAtual}`
        }
      });

      const dados = await response.json();

      if (response.ok) {
        const u = dados.usuario;
        usuarioSessao = u;
        localStorage.setItem("usuarioLogado", JSON.stringify(u));

        if (nomeBruxoElemento) nomeBruxoElemento.textContent = `Bem-vindo, ${u.nome_completo}`;
        if (numCofreElemento) numCofreElemento.textContent = `${600 + parseInt(u.id)}-A`;

        // Exibe o tipo do cofre na tela e no select se existirem
        if (u.tipo_cofre) {
          if (planoAtualElemento) planoAtualElemento.textContent = u.tipo_cofre;
          if (seletorTipoCofre) seletorTipoCofre.value = u.tipo_cofre;
        }

        // Renderiza a foto do perfil enviada pelo servidor
        renderizarFotoPerfil(u.foto_perfil);

        if (saldoGaleoes) saldoGaleoes.dataset.valor = `${u.galeoes || 0}`;
        if (saldoSicles) saldoSicles.dataset.valor = `${u.sicles || 0}`;
        if (saldoNuques) saldoNuques.dataset.valor = `${u.nuques || 0}`;

        atualizarExibicaoSaldo();
        renderizarHistorico(dados.historico || []);
      } else {
        if (response.status === 401) {
          alert("Sessão expirada. Por favor, faça login novamente.");
          localStorage.removeItem("usuarioLogado");
          localStorage.removeItem("tokenGringotts");
          window.location.href = "login.html";
        } else {
          console.error("Erro no perfil:", dados.erro);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar os dados do perfil:", error);
    }
  }

  // Submissão de alteração do Tipo de Cofre
  if (btnSalvarTipoCofre) {
    btnSalvarTipoCofre.addEventListener("click", async () => {
      const tokenAtual = localStorage.getItem("tokenGringotts");
      const novoTipo = seletorTipoCofre ? seletorTipoCofre.value : "";

      if (!usuarioSessao || !usuarioSessao.id) {
        alert("Sessão não encontrada. Faça login novamente.");
        return;
      }

      try {
        const res = await fetch(obterUrlApi("alterar_tipo_cofre"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenAtual}`
          },
          body: JSON.stringify({
            usuario_id: usuarioSessao.id,
            tipo_cofre: novoTipo
          })
        });

        const resData = await res.json();
        if (res.ok && resData.sucesso) {
          alert(resData.mensagem || "Categoria do cofre atualizada com sucesso!");
          usuarioSessao.tipo_cofre = novoTipo;
          localStorage.setItem("usuarioLogado", JSON.stringify(usuarioSessao));
          if (planoAtualElemento) planoAtualElemento.textContent = novoTipo;
          carregarPerfil();
        } else {
          alert("Erro: " + (resData.erro || "Falha ao alterar a categoria do cofre."));
        }
      } catch (err) {
        alert("Erro de comunicação com o servidor: " + err.message);
      }
    });
  }

  function renderizarHistorico(historico) {
    if (!listaHistorico) return;

    if (historico.length === 0) {
      listaHistorico.innerHTML = `<li class="item-historico">Nenhuma movimentação registada.</li>`;
      return;
    }

    const sufixosMoeda = {
      'galeoes': 'Gál',
      'sicles': 'Sic',
      'nuques': 'Nuq'
    };

    listaHistorico.innerHTML = historico.map(t => {
      const sinal = t.tipo === 'ENTRADA' ? '+' : '-';
      const dataFormatada = new Date(t.data_transacao).toLocaleDateString('pt-BR');
      const sufixo = sufixosMoeda[t.moeda] || 'Gál';
      return `
        <li class="item-historico ${t.tipo}">
          <div>
            <span class="descricao-historico">${t.descricao}</span>
            <br><small class="data-historico">${dataFormatada}</small>
          </div>
          <span class="valor-historico">${sinal} ${t.valor} ${sufixo}</span>
        </li>
      `;
    }).join('');
  }

  function atualizarExibicaoSaldo() {
    if (!saldoGaleoes || !saldoSicles || !saldoNuques) return;

    if (saldoOculto) {
      saldoGaleoes.textContent = "••••••";
      saldoSicles.textContent = "••••••";
      saldoNuques.textContent = "••••••";
    } else {
      saldoGaleoes.textContent = saldoGaleoes.dataset.valor || "0";
      saldoSicles.textContent = saldoSicles.dataset.valor || "0";
      saldoNuques.textContent = saldoNuques.dataset.valor || "0";
    }
  }

  if (btnToggleSaldo) {
    btnToggleSaldo.addEventListener("click", () => {
      saldoOculto = !saldoOculto;
      btnToggleSaldo.textContent = saldoOculto ? "🙈" : "👁️";
      atualizarExibicaoSaldo();
    });
  }

  // Abertura do Modal de Edição de Perfil
  if (btnAbrirModalPerfil) {
    btnAbrirModalPerfil.addEventListener("click", () => {
      const u = usuarioSessao;
      if (editNomeCompleto) editNomeCompleto.value = u.nome_completo || "";
      if (editFamilia) editFamilia.value = u.familia || "";
      if (editProfissao) editProfissao.value = u.profissao || "";
      if (seletorTipoCofre && u.tipo_cofre) seletorTipoCofre.value = u.tipo_cofre;

      fotoBase64 = u.foto_perfil || "";
      if (fotoBase64) {
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

  // Leitura do Arquivo de Imagem para Base64
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

  // Submissão da atualização de perfil
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
            usuarioSessao = resultado.usuario;
          }
          if (modalEditarPerfil) modalEditarPerfil.style.display = "none";
          carregarPerfil();
        } else {
          alert("Erro: " + (resultado.erro || "Falha ao atualizar dados."));
        }
      } catch (err) {
        alert("Erro de comunicação: " + err.message);
      }
    });
  }

  // Ações do Modal de Operações no Cofre
  if (btnDepositar) {
    btnDepositar.addEventListener("click", () => {
      if (opTipo) opTipo.value = "ENTRADA";
      if (modalTitulo) modalTitulo.textContent = "Guardar Moedas no Cofre";
      if (modal) modal.style.display = "flex";
    });
  }

  if (btnRetirar) {
    btnRetirar.addEventListener("click", () => {
      if (opTipo) opTipo.value = "SAIDA";
      if (modalTitulo) modalTitulo.textContent = "Retirar Moedas do Cofre";
      if (modal) modal.style.display = "flex";
    });
  }

  if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
  }

  if (formOperacao) {
    formOperacao.addEventListener("submit", async (e) => {
      e.preventDefault();

      const tokenAtual = localStorage.getItem("tokenGringotts");
      const dadosOperacao = {
        usuario_id: usuarioSessao.id,
        tipo: opTipo ? opTipo.value : "ENTRADA",
        moeda: document.getElementById("op-moeda") ? document.getElementById("op-moeda").value : "galeoes",
        descricao: document.getElementById("op-descricao") ? document.getElementById("op-descricao").value : "Movimentação",
        valor: document.getElementById("op-valor") ? document.getElementById("op-valor").value : 0
      };

      try {
        const res = await fetch(obterUrlApi("movimentar"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tokenAtual}`
          },
          body: JSON.stringify(dadosOperacao)
        });

        const resData = await res.json();
        if (res.ok) {
          alert(resData.mensagem);
          if (modal) modal.style.display = "none";
          formOperacao.reset();
          carregarPerfil();
        } else {
          if (res.status === 401) {
            alert("Sessão expirada. Faça login novamente.");
            localStorage.removeItem("usuarioLogado");
            localStorage.removeItem("tokenGringotts");
            window.location.href = "login.html";
          } else {
            alert("Erro: " + (resData.erro || "Falha ao movimentar saldo."));
          }
        }
      } catch (err) {
        alert("Falha de comunicação: " + err.message);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("tokenGringotts");
      alert("Sessão encerrada com sucesso.");
      window.location.href = "login.html";
    });
  }

  // Alteração de Senha via JWT
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

  carregarPerfil();
});