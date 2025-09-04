// ==UserScript==
// @name         Moodle AutoComplete (Stealth)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Marca atividades automaticamente no Moodle sem overlay até o final
// @author       Lucas
// @match        https://educacao.sp.gov.br/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    class RateLimitedQueue {
        constructor(interval, maxRequests) {
            this.interval = interval;
            this.maxRequests = maxRequests;
            this.queue = [];
            this.activeRequests = 0;
        }

        enqueue(task) {
            this.queue.push(task);
            this.processQueue();
        }

        processQueue() {
            if (this.queue.length === 0 || this.activeRequests >= this.maxRequests) return;
            const task = this.queue.shift();
            this.activeRequests++;
            task()
                .catch((error) => console.error("Erro ao processar tarefa:", error))
                .finally(() => {
                    this.activeRequests--;
                    setTimeout(() => this.processQueue(), this.interval);
                });
        }
    }

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function fetchWithRetry(url, options = {}, retries = 5, backoff = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            } catch (err) {
                console.warn(`Erro na requisição (tentativa ${i + 1}):`, err);
                if (i < retries - 1) await sleep(backoff * Math.pow(2, i));
            }
        }
        throw new Error(`Falha ao requisitar: ${url}`);
    }

    async function markActivity(activity) {
        try {
            const url = activity.querySelector("a")?.href;
            if (!url) return;

            if (activity.classList.contains("modtype_quiz")) {
                await handleQuiz(url);
            } else {
                await fetchWithRetry(url);
            }
        } catch (err) {
            console.error("Erro ao marcar atividade:", err);
        }
    }

    async function handleQuiz(url) {
        const quizPage = await fetchWithRetry(url);
        const quizText = await quizPage.text();

        const attemptUrlMatch = quizText.match(/href="([^"]*attempt\.php[^"]*)"/);
        if (!attemptUrlMatch) return;
        const attemptUrl = attemptUrlMatch[1];

        const attemptPage = await fetchWithRetry(attemptUrl);
        const attemptText = await attemptPage.text();

        const formMatch = attemptText.match(/<form[^>]*id="responseform"[^>]*>([\s\S]*?)<\/form>/);
        if (!formMatch) return;
        const parser = new DOMParser();
        const formDoc = parser.parseFromString(formMatch[0], "text/html");
        const form = formDoc.querySelector("form");

        const formData = new FormData(form);

        // Seleciona alternativa aleatória para cada questão
        formDoc.querySelectorAll(".formulation .answer input[type=radio]").forEach((input) => {
            if (Math.random() < 0.5) formData.set(input.name, input.value);
        });

        const action = form.getAttribute("action");
        await fetchWithRetry(action, { method: "POST", body: formData });
    }

    async function processAllActivities() {
        const queue = new RateLimitedQueue(2000, 2); // até 2 requisições a cada 2s
        const activities = Array.from(document.querySelectorAll("li.activity"));

        return new Promise((resolve) => {
            let completed = 0;
            activities.forEach((activity, i) => {
                queue.enqueue(async () => {
                    await markActivity(activity);
                    completed++;
                    if (completed === activities.length) {
                        console.log("✅ Todas as atividades processadas!");
                        resolve();
                    }
                });
            });
        });
    }

    // Executa automaticamente até o final
    (async () => {
        console.log("▶️ Iniciando processamento automático...");
        await processAllActivities();
    })();
})();
