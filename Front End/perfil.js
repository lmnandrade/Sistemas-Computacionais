document.addEventListener("DOMContentLoaded", () => {
  const dadosSessao = localStorage.getItem("usuarioLogado");

  if (!dadosSessao) {
    alert("Sessão não encontrada. Faça login.");
    window.location.href = "login.html";
    return;
  }

  const usuarioSessao = JSON.parse(dadosSessao);
  let saldoOculto = false;

  // Elementos do DOM
  const nomeBruxoElemento = document.getElementById("nome-bruxo");
  const numCofreElemento = document.getElementById("num-cofre-id");
  const saldoGaleoes = document.getElementById("saldo-galeoes");
  const saldoSicles = document.getElementById("saldo-sicles");
  const saldoNuques = document.getElementById("saldo-nuques");
  const listaHistorico = document.getElementById("lista-historico");
  const btnToggleSaldo = document.getElementById("btn-toggle-saldo");
  const btnLogout = document.getElementById("btn-logout");

  // Modal
  const modal = document.getElementById("modal-operacao");
  const modalTitulo = document.getElementById("modal-titulo");
  const formOperacao = document.getElementById("form-operacao");
  const opTipo = document.getElementById("op-tipo");
  const btnDepositar = document.getElementById("btn-depositar");
  const btnRetirar = document.getElementById("btn-retirar");
  const btnFecharModal = document.getElementById("btn-fechar-modal");

  // Carregar dados reais do servidor
  async function carregarPerfil() {
    try {
      const response = await fetch(`http://localhost/Sistemas-Computacionais/Back-end/api.php?action=get_perfil&usuario_id=${usuarioSessao.id}`);
      const dados = await response.json();

      if (response.ok) {
        const u = dados.usuario;
        nomeBruxoElemento.textContent = `Bem-vindo, ${u.nome_completo}`;
        numCofreElemento.textContent = `${600 + parseInt(u.id)}-A`;

        // Salva os valores nos atributos
        saldoGaleoes.dataset.valor = `${u.galeoes || 0}`;
        saldoSicles.dataset.valor = `${u.sicles || 0}`;
        saldoNuques.dataset.valor = `${u.nuques || 0}`;

        atualizarExibicaoSaldo();
        renderizarHistorico(dados.historico || []);
      }
    } catch (error) {
      console.error("Erro ao carregar os dados do perfil:", error);
    }
  }

  // Exibir histórico com sufixos por moeda
  function renderizarHistorico(historico) {
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
      const dataFormatada = new Date(t.data_transacao).toLocaleDateString('pt-PT');
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

  // Alternar ocultação de saldo
  function atualizarExibicaoSaldo() {
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

  // Abertura e fecho do modal
  if (btnDepositar) {
    btnDepositar.addEventListener("click", () => {
      opTipo.value = "ENTRADA";
      modalTitulo.textContent = "Guardar Moedas no Cofre";
      modal.style.display = "flex";
    });
  }

  if (btnRetirar) {
    btnRetirar.addEventListener("click", () => {
      opTipo.value = "SAIDA";
      modalTitulo.textContent = "Retirar Moedas do Cofre";
      modal.style.display = "flex";
    });
  }

  if (btnFecharModal) {
    btnFecharModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  // Submeter movimentação
  if (formOperacao) {
    formOperacao.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dadosOperacao = {
        usuario_id: usuarioSessao.id,
        tipo: opTipo.value,
        moeda: document.getElementById("op-moeda").value,
        descricao: document.getElementById("op-descricao").value,
        valor: document.getElementById("op-valor").value
      };

      try {
        const res = await fetch("http://localhost/Sistemas-Computacionais/Back-end/api.php?action=movimentar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosOperacao)
        });

        const resData = await res.json();
        if (res.ok) {
          alert(resData.mensagem);
          modal.style.display = "none";
          formOperacao.reset();
          carregarPerfil(); // Recarrega saldos e histórico imediatamente!
        } else {
          alert("Erro: " + resData.erro);
        }
      } catch (err) {
        alert("Falha de comunicação: " + err.message);
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      localStorage.removeItem("usuarioLogado");
      window.location.href = "login.html";
    });
  }

  carregarPerfil();
});
