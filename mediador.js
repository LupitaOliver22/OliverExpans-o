// ==UserScript==
// @name         Mediador Loader Oliverex
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Carrega e executa Oliverex.js diretamente do seu GitHub automaticamente
// @author       Você
// @match        https://educacao.sp.gov.br/*   // ajuste conforme necessário
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    const script = document.createElement('script');
    script.src = 'https://raw.githubusercontent.com/LupitaOliver22/OliverExpans-o/main/Oliverex.js';
    script.type = 'text/javascript';
    script.onload = () => console.log('Oliverex.js carregado com sucesso!');
    script.onerror = () => console.error('Falha ao carregar Oliverex.js');
    document.head.appendChild(script);
})();
