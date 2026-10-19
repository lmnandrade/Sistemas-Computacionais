document.getElementById('form-conversao').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const valorInput = parseFloat(document.getElementById('valor-trouxa').value);
        const moeda = document.getElementById('moeda-origem').value;

        if (isNaN(valorInput) || valorInput <= 0) return;

        // Cotação base para Galeões
        const cotacoesEmGaleao = {
          'BRL': 0.03,
          'USD': 0.20,
          'EUR': 0.22
        };

        const totalGaleoesExatos = valorInput * cotacoesEmGaleao[moeda];

        // Regra de conversão: 1 Galeão = 17 Sicles | 1 Sicle = 29 Nuques (1 Galeão = 493 Nuques)
        const totalNuques = Math.round(totalGaleoesExatos * 17 * 29);

        const galeoes = Math.floor(totalNuques / (17 * 29));
        const nuquesRestantesAposGaleoes = totalNuques % (17 * 29);
        
        const sicles = Math.floor(nuquesRestantesAposGaleoes / 29);
        const nuques = nuquesRestantesAposGaleoes % 29;

        document.getElementById('resultado-extenso').innerHTML = 
          `<strong>${galeoes}</strong> Galeões, <strong>${sicles}</strong> Sicles e <strong>${nuques}</strong> Nuques`;
      });