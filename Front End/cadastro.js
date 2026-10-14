document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.querySelector('.form-cadastro');
  const inputCbf = document.getElementById('cbf');
  const inputRg = document.getElementById('rg');

  if (inputCbf) {
    inputCbf.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  if (inputRg) {
    inputRg.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 9) v = v.slice(0, 9);
      v = v.replace(/(\d{2})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1})$/, '$1-$2');
      e.target.value = v;
    });
  }

  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault();

      const inputSenha = document.getElementById('senha');

      const dadosFormulario = {
        nomeCompleto: document.getElementById('nome')?.value || '',
        email: document.getElementById('email')?.value || '',
        familia: document.getElementById('familia')?.value || '',
        cbf: inputCbf ? inputCbf.value : '',
        rg: inputRg ? inputRg.value : '',
        dataNascimento: document.getElementById('dataNascimento')?.value || '',
        sexo: document.getElementById('sexo')?.value || '',
        profissao: document.getElementById('profissao')?.value || '',
        senha: inputSenha ? inputSenha.value : ''
      };

      try {
        const response = await fetch('http://localhost/Sistemas-Computacionais/Back-end/api.php?action=cadastro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dadosFormulario)
        });

        const resultado = await response.json();

        if (response.ok) {
          alert(resultado.mensagem || 'Solicitação aprovada com sucesso!');
          formCadastro.reset();
          window.location.href = 'login.html';
        } else {
          alert('Erro no cadastro: ' + (resultado.erro || 'Verifique os dados informados.'));
        }
      } catch (error) {
        alert('Falha de comunicação: ' + error.message);
      }
    });
  }
});
