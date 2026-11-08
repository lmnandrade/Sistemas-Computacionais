document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-agendamento");
  const containerForm = document.getElementById("container-form");
  const containerSucesso = document.getElementById("container-sucesso");
  const mensagemConteudo = document.getElementById("mensagem-conteudo");
  const btnNovoAgendamento = document.getElementById("btn-novo-agendamento");
  const statusUsuarioDiv = document.getElementById("status-usuario-login");

  const inputNome = document.getElementById("nome");
  const inputEmail = document.getElementById("email");
  const inputCofre = document.getElementById("cofre");

  let usuarioLogado = null;
  const dadosSessao = localStorage.getItem("usuarioLogado");

  if (dadosSessao) {
    try {
      usuarioLogado = JSON.parse(dadosSessao);

      if (inputNome && usuarioLogado.nome_completo) {
        inputNome.value = usuarioLogado.nome_completo;
      }
      if (inputEmail && usuarioLogado.email) {
        inputEmail.value = usuarioLogado.email;
      }
      if (inputCofre && usuarioLogado.id) {
        const numCofreCalculado = 600 + parseInt(usuarioLogado.id);
        inputCofre.value = `Cofre ${numCofreCalculado}-A`;
      }

      if (statusUsuarioDiv) {
        statusUsuarioDiv.style.display = "block";
        statusUsuarioDiv.innerHTML = `✨ Sessão identificada: <strong>${usuarioLogado.nome_completo || usuarioLogado.email}</strong>.`;
      }
    } catch (e) {
      console.error("Erro ao ler sessão do utilizador:", e);
    }
  } else if (statusUsuarioDiv) {
    statusUsuarioDiv.style.display = "block";
    statusUsuarioDiv.innerHTML = `⚡ Agendando como Visitante. Já tem conta no Banco? <a href="login.html" style="color: #D4AF37; font-weight: bold;">Faça Login aqui</a> para preenchimento automático.`;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const dadosAgendamento = {
        usuario_id: usuarioLogado ? usuarioLogado.id : null,
        nome: inputNome.value.trim(),
        email: inputEmail.value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        servico: document.getElementById("servico").value,
        num_cofre: inputCofre.value.trim(),
        data_visita: document.getElementById("data").value,
        horario_visita: document.getElementById("horario").value,
        observacoes: document.getElementById("observacoes").value.trim()
      };

      try {
        const response = await fetch("../api.php?action=agendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosAgendamento)
        });

        const resultado = await response.json();

        if (response.ok) {
          if (containerForm) containerForm.classList.add("escondido");
          if (containerSucesso) containerSucesso.style.display = "block";

          const dataFormatada = new Date(dadosAgendamento.data_visita + "T00:00:00").toLocaleDateString('pt-BR');

          if (mensagemConteudo) {
            mensagemConteudo.innerHTML = `
              <h3>📜 Agendamento Confirmado com Sucesso!</h3>
              <p><strong>Sr(a). ${dadosAgendamento.nome}</strong>, sua reserva foi registrada pelos Goblins.</p>
              <ul>
                <li><strong>Serviço:</strong> ${dadosAgendamento.servico}</li>
                <li><strong>Data:</strong> ${dataFormatada} às ${dadosAgendamento.horario_visita}</li>
                <li><strong>Cofre Informado:</strong> ${dadosAgendamento.num_cofre || "Nenhum"}</li>
                <li><strong>E-mail de Confirmação:</strong> ${dadosAgendamento.email}</li>
              </ul>
              <p><small>Por favor, apresente-se na recepção de mármore do Banco Gringotts 15 minutos antes do horário agendado.</small></p>
            `;
          }
        } else {
          alert("Erro no agendamento: " + (resultado.erro || "Falha de processamento."));
        }
      } catch (error) {
        alert("Erro de comunicação com o servidor: " + error.message);
      }
    });
  }

  if (btnNovoAgendamento) {
    btnNovoAgendamento.addEventListener("click", () => {
      if (containerSucesso) containerSucesso.style.display = "none";
      if (containerForm) containerForm.classList.remove("escondido");
      form.reset();

      if (usuarioLogado) {
        if (inputNome) inputNome.value = usuarioLogado.nome_completo || "";
        if (inputEmail) inputEmail.value = usuarioLogado.email || "";
        if (inputCofre) inputCofre.value = usuarioLogado.id ? `Cofre ${600 + parseInt(usuarioLogado.id)}-A` : "";
      }
    });
  }
});