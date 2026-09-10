document.addEventListener("DOMContentLoaded", () => {
  // Rolagem suave ao clicar no botão "Conhecer Dragões"
  const btnConhecer = document.querySelector(".btn-conhecer-dragao");

  if (btnConhecer) {
    btnConhecer.addEventListener("click", (e) => {
      const href = btnConhecer.getAttribute("href");
      if (href.startsWith("#")) {
        e.preventDefault();
        const alvo = document.querySelector(href);
        if (alvo) {
          alvo.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  }
});