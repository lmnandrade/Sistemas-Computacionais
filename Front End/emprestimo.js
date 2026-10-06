document.addEventListener("DOMContentLoaded", () => {
  const formEmprestimo = document.getElementById("form-emprestimo");
  const inputValor = document.getElementById("valor-galeoes");
  const selectPrazo = document.getElementById("prazo-pagamento");
  const selectGarantia = document.getElementById("garantia-cofre");
  const resultadoParcela = document.getElementById("resultado-parcela");
  const resultadoTotal = document.getElementById("resultado-total");
  const mensagemResposta = document.getElementById("mensagem-resposta");

  // Função para calcular a estimativa
  function calcularEmprestimo() {
    const valor = parseFloat(inputValor.value) || 0;
    const prazo = parseInt(selectPrazo.value) || 12;
    const garantia = selectGarantia.value;

    if (valor <= 0) {
      resultadoParcela.textContent = "0 Gál / lua";
      resultadoTotal.textContent = "0 Galeões";
      return;
    }

    // Definir taxa anual baseada na garantia
    let taxaAnual = 0.05; // 5% ao ano padrão
    if (garantia === "cofre") taxaAnual = 0.025;
    if (garantia === "artefato") taxaAnual = 0.03;

    const taxaMensal = taxaAnual / 12;
    const totalComJuros = valor * (1 + taxaMensal * prazo);
    const parcela = totalComJuros / prazo;

    resultadoParcela.textContent = `${Math.ceil(parcela)} Gál / lua`;
    resultadoTotal.textContent = `${Math.ceil(totalComJuros)} Galeões`;
  }

  // Recalcula em tempo real nos eventos de input
  inputValor.addEventListener("input", calcularEmprestimo);
  selectPrazo.addEventListener("change", calcularEmprestimo);
  selectGarantia.addEventListener("change", calcularEmprestimo);

  // Envio da solicitação
  if (formEmprestimo) {
    formEmprestimo.addEventListener("submit", (e) => {
      e.preventDefault();

      const registro = document.getElementById("registro-ministerio").value.trim();
      const valor = inputValor.value;

      mensagemResposta.className = "mensagem-resposta sucesso";
      mensagemResposta.innerHTML = 
        `📜 <strong>Solicitação Registrada com Sucesso!</strong><br><br>` +
        `Sua proposta de empréstimo no valor de <strong>${valor} Galeões</strong> (Registro: <em>${registro}</em>) ` +
        `foi enviada para avaliação técnica do Conselho de Duendes.<br>` +
        `Uma coruja com o selo de aprovação chegará ao seu endereço em até 24 horas.`;

      mensagemResposta.classList.remove("escondido");
      formEmprestimo.reset();
      calcularEmprestimo();
    });
  }
});