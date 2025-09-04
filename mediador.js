javascript:(function(){
    const s=document.createElement('script');
    s.src='https://raw.githubusercontent.com/LupitaOliver22/OliverExpans-o/main/Oliverex.js';
    s.type='text/javascript';
    s.onload = () => alert("✅ Oliverex.js carregado com sucesso!");
    s.onerror = () => alert("❌ Erro ao carregar Oliverex.js");
    document.head.appendChild(s);
})();
