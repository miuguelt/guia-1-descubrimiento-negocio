/**
 * Simulador SIPOC
 * ---------------------------------------------------------------------------
 * Este archivo contiene únicamente la lógica del reto de arrastrar tarjetas.
 * Está escrito en JavaScript sin dependencias para que el aprendiz pueda
 * relacionar cada evento del navegador con un cambio visible en la interfaz.
 */
(function () {
  "use strict";

  // Cada objeto representa una tarjeta y su única ubicación correcta.
  const CARDS = [
    {
      id: "supplier-card",
      type: "supplier",
      letter: "S",
      title: "Área de compras",
      description: "Entrega el insumo inicial",
      hint: "Piensa en quién entrega o provee algo al proceso."
    },
    {
      id: "input-card",
      type: "input",
      letter: "I",
      title: "Requerimiento del cliente",
      description: "Información que ingresa",
      hint: "Es la información o recurso que entra para ser transformado."
    },
    {
      id: "process-card",
      type: "process",
      letter: "P",
      title: "Analizar y modelar el proceso",
      description: "Transforma la necesidad",
      hint: "Busca la acción que convierte una necesidad en un resultado."
    },
    {
      id: "output-card",
      type: "output",
      letter: "O",
      title: "Modelo de proceso validado",
      description: "Resultado del análisis",
      hint: "Es el producto o resultado que sale después de la transformación."
    },
    {
      id: "customer-card",
      type: "customer",
      letter: "C",
      title: "Equipo de desarrollo",
      description: "Recibe el resultado",
      hint: "Es quien usa o recibe el resultado del proceso."
    }
  ];

  let selectedCardId = null;
  let placedCount = 0;

  /**
   * Devuelve una copia barajada del arreglo usando Fisher-Yates.
   * Barajar cada reinicio evita que el reto se convierta en memoria visual.
   */
  function shuffle(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }

    return copy;
  }

  /** Crea el botón-tarjeta que el aprendiz puede arrastrar o seleccionar. */
  function createCardElement(card) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "card-chip";
    element.id = card.id;
    element.draggable = true;
    element.dataset.type = card.type;
    element.setAttribute("aria-label", `${card.title}. ${card.description}`);

    element.innerHTML = `
      <span class="chip-letter" aria-hidden="true">${card.letter}</span>
      <span class="chip-copy">
        <strong>${card.title}</strong>
        <small>${card.description}</small>
      </span>
    `;

    // Selección por clic: sirve como alternativa accesible al drag and drop.
    element.addEventListener("click", () => selectCard(element));

    // El evento dragstart guarda el id, no todo el objeto. Así el drop solo
    // necesita buscar la tarjeta existente en el DOM.
    element.addEventListener("dragstart", (event) => {
      selectedCardId = element.id;
      event.dataTransfer.setData("text/plain", element.id);
      event.dataTransfer.effectAllowed = "move";
      element.classList.add("is-dragging");
    });

    element.addEventListener("dragend", () => {
      element.classList.remove("is-dragging");
    });

    return element;
  }

  function selectCard(cardElement) {
    const wasSelected = selectedCardId === cardElement.id;

    document.querySelectorAll(".card-chip.is-selected").forEach((card) => {
      card.classList.remove("is-selected");
    });

    selectedCardId = wasSelected ? null : cardElement.id;

    if (selectedCardId) {
      cardElement.classList.add("is-selected");
      setFeedback("info", "Tarjeta seleccionada. Ahora elige o activa la columna correspondiente.");
    } else {
      setFeedback("info", "Selecciona una tarjeta para comenzar.");
    }
  }

  function setFeedback(type, message) {
    const feedback = document.querySelector("#simulator-feedback");
    if (!feedback) return;

    feedback.className = "simulator-feedback";
    if (type === "success") feedback.classList.add("is-success");
    if (type === "error") feedback.classList.add("is-error");

    const icon = feedback.querySelector(".feedback-icon");
    const text = feedback.querySelector("span:last-child");
    icon.textContent = type === "success" ? "✓" : type === "error" ? "!" : "i";
    text.textContent = message;
  }

  function updateScore() {
    const score = document.querySelector("#simulator-score");
    const bankCount = document.querySelector("#bank-count");

    if (score) score.textContent = `${placedCount}/${CARDS.length}`;
    if (bankCount) {
      const available = CARDS.length - placedCount;
      bankCount.textContent = `${available} ${available === 1 ? "disponible" : "disponibles"}`;
    }
  }

  function markZoneAsWrong(zone) {
    zone.classList.remove("is-wrong");
    // Forzar un reflow permite repetir la animación en intentos consecutivos.
    void zone.offsetWidth;
    zone.classList.add("is-wrong");
    window.setTimeout(() => zone.classList.remove("is-wrong"), 380);
  }

  /**
   * Comprueba la respuesta y mueve la tarjeta únicamente si es correcta.
   * Esta función es el corazón pedagógico del simulador: feedback inmediato
   * y una explicación breve convierten el error en una pista de aprendizaje.
   */
  function placeCard(cardId, zone) {
    const cardElement = document.getElementById(cardId);
    const card = CARDS.find((item) => item.id === cardId);

    if (!cardElement || !card || zone.classList.contains("has-card")) return;

    if (card.type !== zone.dataset.slot) {
      markZoneAsWrong(zone);
      setFeedback("error", `Aún no. ${card.hint}`);
      return;
    }

    const content = zone.querySelector(".drop-zone-content");
    content.appendChild(cardElement);
    cardElement.classList.remove("is-selected", "is-dragging");
    cardElement.classList.add("is-placed");
    cardElement.draggable = false;
    cardElement.disabled = true;
    selectedCardId = null;
    zone.classList.add("has-card", "is-correct");
    placedCount += 1;
    updateScore();

    if (placedCount === CARDS.length) {
      setFeedback("success", "¡Excelente! Construiste la matriz SIPOC y puedes ver el proceso de extremo a extremo.");
      window.dispatchEvent(new CustomEvent("sipoc:complete"));
    } else {
      setFeedback("success", `¡Correcto! ${placedCount} de ${CARDS.length} componentes ya están ubicados.`);
    }
  }

  function getDraggedCardId(event) {
    return event.dataTransfer ? event.dataTransfer.getData("text/plain") : selectedCardId;
  }

  function bindDropZone(zone) {
    // dragover debe cancelar su comportamiento por defecto para permitir drop.
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (!zone.classList.contains("has-card")) zone.classList.add("is-over");
    });

    zone.addEventListener("dragleave", () => zone.classList.remove("is-over"));

    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-over");
      placeCard(getDraggedCardId(event), zone);
    });

    // En teclado, Enter o barra espaciadora colocan la tarjeta seleccionada.
    zone.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && selectedCardId) {
        event.preventDefault();
        placeCard(selectedCardId, zone);
      }
    });

    // También se puede hacer clic en la columna después de seleccionar una tarjeta.
    zone.addEventListener("click", () => {
      if (selectedCardId) placeCard(selectedCardId, zone);
    });
  }

  function showHint() {
    if (!selectedCardId) {
      setFeedback("info", "Selecciona primero una tarjeta; luego verás una pista específica sobre su función.");
      return;
    }

    const card = CARDS.find((item) => item.id === selectedCardId);
    if (card) setFeedback("info", `Pista: ${card.hint}`);
  }

  function resetSimulator() {
    const bank = document.querySelector("#bank-cards");
    const zones = document.querySelectorAll(".drop-zone");
    if (!bank) return;

    bank.innerHTML = "";
    zones.forEach((zone) => {
      zone.classList.remove("has-card", "is-correct", "is-wrong", "is-over");
      zone.querySelector(".drop-zone-content").innerHTML = "";
    });

    shuffle(CARDS).forEach((card) => bank.appendChild(createCardElement(card)));
    selectedCardId = null;
    placedCount = 0;
    updateScore();
    setFeedback("info", "Selecciona una tarjeta para comenzar.");
  }

  function initSimulator() {
    const bank = document.querySelector("#bank-cards");
    const zones = document.querySelectorAll(".drop-zone");
    if (!bank || !zones.length) return;

    zones.forEach(bindDropZone);
    document.querySelector("#simulator-hint")?.addEventListener("click", showHint);
    document.querySelector("#simulator-reset")?.addEventListener("click", resetSimulator);
    resetSimulator();
  }

  // Exponemos una pequeña API para que el archivo pueda reiniciarse desde la
  // consola del navegador durante una clase o una demostración.
  window.SIPOCSimulator = { init: initSimulator, reset: resetSimulator };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSimulator);
  } else {
    initSimulator();
  }
})();
