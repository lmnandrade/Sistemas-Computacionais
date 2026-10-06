document.addEventListener("DOMContentLoaded", () => {
  const formAvaliacao = document.getElementById("form-avaliacao");
  const mensagemResposta = document.getElementById("mensagem-resposta");

  if (formAvaliacao) {
    formAvaliacao.addEventListener("submit", (e) => {
      e.preventDefault();

      const nome = document.getElementById("nome-bruxo").value.trim();
      const registro = document.getElementById("registro-ministerio").value.trim();
      const tipo = document.getElementById("tipo-ativo").options[document.getElementById("tipo-ativo").selectedIndex].text;
      const protocolo = "PER-" + Math.floor(100000 + Math.random() * 900000);

      mensagemResposta.className = "mensagem-resposta sucesso";
      mensagemResposta.innerHTML = 
        `<strong>REQUERIMENTO PROTOCOLADO SOB Nº ${protocolo}</strong><br><br>` +
        `Prezado(a) <strong>${nome}</strong> (Reg. <em>${registro}</em>), a sua solicitação de perícia para a categoria ` +
        `<strong>"${tipo}"</strong> foi recebida e encaminhada ao Conselho Superior de Duendes do Banco Gringotes.<br><br>` +
        `O prazo estimado para o laudo formal é de até 48 horas úteis.`;

      mensagemResposta.classList.remove("escondido");
      formAvaliacao.reset();

      mensagemResposta.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }
});