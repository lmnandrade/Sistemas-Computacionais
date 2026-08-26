document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.querySelector('.form-cadastro');
  const inputCbf = document.getElementById('cbf');
  const inputRg = document.getElementById('rg');

  // Máscara automática para CBF (CPF): 000.000.000-00
  if (inputCbf) {
    inputCbf.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
      if (v.length > 11) v = v.slice(0, 11); // Limita em 11 dígitos
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  // Máscara automática para RG Bruxo: 00.000.000-0
  if (inputRg) {
    inputRg.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
      if (v.length > 9) v = v.slice(0, 9); // Limita em 9 dígitos
      v = v.replace(/(\d{2})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1})$/, '$1-$2');
      e.target.value = v;
    });
  }

  // Envio do formulário via API
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const dadosFormulario = {
        nomeCompleto: document.getElementById('nome').value,
        familia: document.getElementById('familia').value,
        cbf: inputCbf.value,
        rg: inputRg.value,
        dataNascimento: document.getElementById('dataNascimento').value,
        sexo: document.getElementById('sexo').value,
        profissao: document.getElementById('profissao').value
      };

      try {
        const response = await fetch('http://localhost:8080/api/cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dadosFormulario)
        });

        if (response.ok) {
          alert('Solicitação de abertura de cofre enviada com sucesso!');
          formCadastro.reset();
        } else {
          alert('Erro ao enviar solicitação. Verifique os dados e tente novamente.');
        }
      } catch (error) {
        console.error('Erro na conexão com o servidor de Gringotts:', error);
        alert('Servidor indisponível no momento. Tente novamente mais tarde.');
      }
    });
  }
});