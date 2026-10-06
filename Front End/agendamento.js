document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form-agendamento");
  const containerForm = document.getElementById("container-form");
  const containerSucesso = document.getElementById("container-sucesso");
  const mensagemConteudo = document.getElementById("mensagem-conteudo");
  const btnNovoAgendamento = document.getElementById("btn-novo-agendamento");
  const campoData = document.getElementById("data");
  const campoTelefone = document.getElementById("telefone");

  // Configuração da data mínima (hoje)
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  if (campoData) campoData.setAttribute("min", `${ano}-${mes}-${dia}`);

  // Máscara para o telefone
  if (campoTelefone) {
    campoTelefone.addEventListener("input", (e) => {
      let valor = e.target.value.replace(/\D/g, "");
      if (valor.length > 11) valor = valor.slice(0, 11);

      if (valor.length > 6) {
        valor = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7)}`;
      } else if (valor.length > 2) {
        valor = `(${valor.slice(0, 2)}) ${valor.slice(2)}`;
      } else if (valor.length > 0) {
        valor = `(${valor}`;
      }
      e.target.value = valor;
    });
  }

  // Submissão do Formulário
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome").value.trim();
      const email = document.getElementById("email").value.trim();
      const servicoSelect = document.getElementById("servico");
      const servicoTexto = servicoSelect.options[servicoSelect.selectedIndex].text;
      const horario = document.getElementById("horario").value;

      // Converte data de YYYY-MM-DD para DD/MM/YYYY
      const [anoSel, mesSel, diaSel] = campoData.value.split("-");
      const dataFormatada = `${diaSel}/${mesSel}/${anoSel}`;

      // Validação de Domingo
      const dataObjeto = new Date(anoSel, mesSel - 1, diaSel);
      if (dataObjeto.getDay() === 0) {
        alert("O Banco Gringotts não realiza atendimentos aos domingos. Por favor, escolha outro dia.");
        return;
      }

      // Preenche o bloco de sucesso
      mensagemConteudo.innerHTML = `
        📜 <strong>Agendamento Confirmado!</strong><br><br>
        Prezado(a) <strong>${nome}</strong>, sua visita para <em>${servicoTexto}</em> foi reservada para o dia 
        <strong>${dataFormatada}</strong> às <strong>${horario}h</strong>.<br><br>
        🦉 Uma coruja com as instruções de acesso ao Salão Principal foi enviada para <u>${email}</u>.
      `;

      // Esconde o bloco do formulário e exibe o bloco de confirmação
      containerForm.style.display = "none";
      containerSucesso.style.display = "block";

      form.reset();
    });
  }

  // Evento do botão "Novo Agendamento"
  if (btnNovoAgendamento) {
    btnNovoAgendamento.addEventListener("click", () => {
      containerSucesso.style.display = "none";
      containerForm.style.display = "block";
    });
  }
});