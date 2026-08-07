/**
 * Comportamiento general de la guía
 * ---------------------------------------------------------------------------
 * Aquí viven las interacciones que no pertenecen al simulador: navegación,
 * menú responsive, seguimiento visual de la ruta y validación final.
 */
(function () {
  "use strict";

  const ANSWERS = {
    q1: "b",
    q2: "a",
    q3: "c",
    q4: "a"
  };

  const RAP_MESSAGE = "Has alcanzado el Resultado de Aprendizaje: puedes caracterizar los procesos de la organización de acuerdo con el software a construir.";

  function setupMobileMenu() {
    const menuButton = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");
    if (!menuButton || !nav) return;

    function closeMenu() {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }

    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function setupActiveNavigation() {
    const sections = ["inicio", "descubrimiento", "instrumentos", "conceptos", "proceso", "simulador", "validacion"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const links = [...document.querySelectorAll(".nav-link")];

    function markActive(sectionId) {
      links.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${sectionId}`;
        link.classList.toggle("is-active", isActive);
      });
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

          if (visible[0]) markActive(visible[0].target.id);
        },
        { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.25, 0.6] }
      );

      sections.forEach((section) => observer.observe(section));
    }
  }

  function updateRouteStep(stepIndex) {
    const step = document.querySelectorAll(".map-item")[stepIndex];
    if (!step) return;

    step.classList.add("map-item-done");
    const state = step.querySelector(".map-state");
    if (state) {
      state.textContent = "✓";
      state.setAttribute("aria-label", "Completado");
    }
  }

  function setupSimulatorProgress() {
    // El simulador emite un evento propio para no acoplar sus detalles a la
    // navegación general de la guía.
    window.addEventListener("sipoc:complete", () => updateRouteStep(2));
  }

  function updateQuizProgress() {
    const totalQuestions = Object.keys(ANSWERS).length;
    const answered = Object.keys(ANSWERS).filter((name) => document.querySelector(`input[name="${name}"]:checked`)).length;
    const progressText = document.querySelector("#quiz-progress");
    const progressBar = document.querySelector("#quiz-progress-bar");

    if (progressText) progressText.textContent = `${answered} de ${totalQuestions} respondidas`;
    if (progressBar) progressBar.style.width = `${(answered / totalQuestions) * 100}%`;
  }

  function showQuizResult(type, message) {
    const result = document.querySelector("#quiz-result");
    if (!result) return;

    result.className = `quiz-result is-visible is-${type}`;
    result.textContent = message;
  }

  function evaluateQuiz(event) {
    event.preventDefault();

    const unanswered = Object.keys(ANSWERS).filter((name) => !document.querySelector(`input[name="${name}"]:checked`));
    if (unanswered.length > 0) {
      showQuizResult("error", `Te falta responder ${unanswered.length === 1 ? "una pregunta" : `${unanswered.length} preguntas`}. Completa todas para conocer tu resultado.`);
      document.querySelector(`input[name="${unanswered[0]}"]`)?.focus();
      return;
    }

    const score = Object.entries(ANSWERS).reduce((total, [name, answer]) => {
      const selected = document.querySelector(`input[name="${name}"]:checked`);
      return total + (selected?.value === answer ? 1 : 0);
    }, 0);

    const passingScore = 3;

    if (score >= passingScore) {
      showQuizResult("success", `¡RAP alcanzado! Obtuviste ${score}/${Object.keys(ANSWERS).length}. ${RAP_MESSAGE}`);
      updateRouteStep(3);
      document.querySelector("#cierre")?.classList.add("is-unlocked");
    } else {
      showQuizResult("error", `Obtuviste ${score}/${Object.keys(ANSWERS).length}. Revisa la analogía y vuelve a intentarlo: necesitas al menos ${passingScore} respuestas correctas.`);
    }
  }

  function setupQuiz() {
    const form = document.querySelector("#quiz-form");
    if (!form) return;

    form.querySelectorAll("input[type=radio]").forEach((input) => {
      input.addEventListener("change", updateQuizProgress);
    });
    form.addEventListener("submit", evaluateQuiz);
    updateQuizProgress();
  }

  function setupExerciseValidation() {
    const btnEx1 = document.querySelector("#btn-validate-ex1");
    const feedbackEx1 = document.querySelector("#feedback-ex1");
    if (!btnEx1 || !feedbackEx1) return;

    btnEx1.addEventListener("click", () => {
      const selected = [...document.querySelectorAll(".ex1-check:checked")].map((el) => el.value);
      const isCorrect = selected.length === 3 && selected.includes("q1") && selected.includes("q3") && selected.includes("q4");

      if (isCorrect) {
        feedbackEx1.className = "exercise-feedback is-success";
        feedbackEx1.textContent = "¡Excelente! Has seleccionado las 3 preguntas abiertas clave (excepciones, cuellos de botella y autoridad). La opción q2 es una pregunta cerrada/inducida que debes evitar en una entrevista.";
      } else {
        feedbackEx1.className = "exercise-feedback is-error";
        feedbackEx1.textContent = "Selecciona exactamente 3 opciones. Pista: busca preguntas abiertas que exploren excepciones, cuellos de botella y niveles de autorización.";
      }
    });
  }

  function initApp() {
    setupMobileMenu();
    setupActiveNavigation();
    setupSimulatorProgress();
    setupQuiz();
    setupExerciseValidation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
