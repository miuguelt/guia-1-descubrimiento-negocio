/**
 * Simulador SIPOC — Reto: caracterizar el proceso de solicitud de software
 * ---------------------------------------------------------------------------
 * Este archivo contiene únicamente la lógica del reto de clasificar tarjetas.
 * Está escrito en JavaScript sin dependencias para que el aprendiz pueda
 * relacionar cada evento del navegador con un cambio visible en la interfaz.
 *
 * Reglas del reto:
 *  - 10 tarjetas pertenecen al proceso (dos por cada componente SIPOC).
 *  - 2 tarjetas son distractores: pertenecen a otros procesos y deben ir a la
 *    zona "Fuera del proceso". Obligan a delimitar el alcance, no a adivinar.
 *  - Cada ubicación incorrecta suma un error y cada pista se registra: el
 *    resumen final reporta precisión, errores y pistas para la evidencia SENA.
 */
(function () {
  "use strict";

  /**
   * Cada objeto representa una tarjeta y su única ubicación correcta.
   *
   * `description` describe el elemento tal como aparece en el caso: nunca dice
   * "entrega", "ingresa", "sale" ni "recibe", porque esas palabras regalarían
   * la respuesta. `hint` formula una pregunta y `hintDeep` se muestra solo si
   * el aprendiz vuelve a pedir ayuda sobre la misma tarjeta. `why` es la
   * justificación que se revela al acertar y queda en la matriz final.
   */
  const CARDS = [
    {
      id: "card-s1",
      type: "supplier",
      letter: "S",
      title: "Líder del área solicitante",
      description: "Jefe del área de cartera, dueño del proceso afectado",
      hint: "¿Este elemento origina algo o depende de algo que otro produjo?",
      hintDeep: "Es una persona que existe antes de que el proceso arranque: sin ella no habría solicitud.",
      why: "Origina la necesidad; sin su petición el proceso no arranca."
    },
    {
      id: "card-s2",
      type: "supplier",
      letter: "S",
      title: "Mesa de ayuda (Service Desk)",
      description: "Ventanilla única donde se radican las peticiones de TI",
      hint: "¿Es un actor, un documento o una actividad? Empieza por ahí.",
      hintDeep: "Es un actor que aporta la petición al equipo, no el destinatario del resultado.",
      why: "Canaliza la petición hacia el proceso: también es fuente."
    },
    {
      id: "card-i1",
      type: "input",
      letter: "I",
      title: "Formato de solicitud diligenciado",
      description: "Documento con la necesidad y su justificación",
      hint: "¿Existe antes del análisis o es consecuencia del análisis?",
      hintDeep: "Es un documento que ya existe cuando el proceso comienza y será transformado.",
      why: "Es el insumo documental que el proceso transforma."
    },
    {
      id: "card-i2",
      type: "input",
      letter: "I",
      title: "Criterios de aceptación del área",
      description: "Condiciones que el negocio considera obligatorias",
      hint: "¿Condiciona el trabajo o es producto del trabajo?",
      hintDeep: "Llega desde el área junto con la petición: condiciona el resultado, no lo produce.",
      why: "Insumo que fija las condiciones de conformidad."
    },
    {
      id: "card-p1",
      type: "process",
      letter: "P",
      title: "Registrar y clasificar la solicitud",
      description: "Tipificación de la petición y asignación de responsable",
      hint: "¿Puedes ejecutarlo? Si es una acción, no es un documento ni un actor.",
      hintDeep: "Está redactado como actividad: ocurre dentro del proceso.",
      why: "Actividad interna que convierte la petición en información útil."
    },
    {
      id: "card-p2",
      type: "process",
      letter: "P",
      title: "Priorizar en el comité de cambios",
      description: "Evaluación de impacto, urgencia y viabilidad",
      hint: "¿Esto es trabajo que alguien hace, o el producto de ese trabajo?",
      hintDeep: "Es una reunión de trabajo: pertenece a la secuencia de actividades.",
      why: "Actividad que decide el orden de atención."
    },
    {
      id: "card-o1",
      type: "output",
      letter: "O",
      title: "Solicitud aprobada y priorizada",
      description: "Acta del comité con la decisión tomada",
      hint: "¿Existía al inicio del proceso o solo después de ejecutarlo?",
      hintDeep: "Solo puede existir cuando las actividades ya ocurrieron: es un resultado.",
      why: "Resultado formal de las actividades de análisis y priorización."
    },
    {
      id: "card-o2",
      type: "output",
      letter: "O",
      title: "Ficha de requisito documentada",
      description: "Documento con alcance, reglas y criterios consolidados",
      hint: "¿Es un producto terminado o algo que aún debe procesarse aquí?",
      hintDeep: "Es un entregable del proceso, aunque después sirva de insumo a otro.",
      why: "Producto tangible que el proceso entrega al siguiente eslabón."
    },
    {
      id: "card-c1",
      type: "customer",
      letter: "C",
      title: "Equipo de desarrollo",
      description: "Célula que construirá el módulo solicitado",
      hint: "¿Aporta algo al inicio o usa lo que el proceso produce?",
      hintDeep: "Trabaja con la ficha de requisito ya elaborada: está al final de la cadena.",
      why: "Usa la salida del proceso para construir la solución."
    },
    {
      id: "card-c2",
      type: "customer",
      letter: "C",
      title: "Dueño de producto (Product Owner)",
      description: "Responsable de que la solución aporte valor al negocio",
      hint: "¿Aprueba el resultado o produce el insumo inicial?",
      hintDeep: "Valida lo que el proceso produjo: es destinatario, no fuente.",
      why: "Valida que el resultado responda a la necesidad."
    },
    {
      id: "card-x1",
      type: "none",
      letter: "✕",
      title: "Despliegue en el servidor de producción",
      description: "Publicación de la versión ya construida y probada",
      hint: "¿Ocurre mientras se decide la solicitud o mucho después?",
      hintDeep: "Sucede al final del ciclo de vida: pertenece al proceso de entrega, no a este.",
      why: "Pertenece al proceso de entrega: queda fuera del alcance."
    },
    {
      id: "card-x2",
      type: "none",
      letter: "✕",
      title: "Encuesta de clima laboral del área",
      description: "Medición de satisfacción del personal",
      hint: "¿Alguna actividad de este proceso la usa o la produce?",
      hintDeep: "Ni entra ni sale de esta cadena: pertenece a gestión humana.",
      why: "No alimenta ni resulta de este proceso: fuera del alcance."
    }
  ];

  const SLOT_NAMES = {
    supplier: "Proveedor (S)",
    input: "Entrada (I)",
    process: "Proceso (P)",
    output: "Salida (O)",
    customer: "Cliente (C)",
    none: "Fuera del proceso"
  };

  const STORAGE_KEY = "sipoc-guia1-mejor-intento";

  let selectedCardId = null;
  let placedCount = 0;
  let errorCount = 0;
  let hintCount = 0;
  let startedAt = null;
  // Pistas pedidas por tarjeta: la segunda petición entrega la ayuda profunda.
  let hintsByCard = {};

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
    element.setAttribute("aria-label", `${card.title}. ${card.description}. Sin ubicar.`);

    element.innerHTML = `
      <span class="chip-letter" aria-hidden="true">?</span>
      <span class="chip-copy">
        <strong>${card.title}</strong>
        <small>${card.description}</small>
      </span>
    `;

    // Selección por clic: sirve como alternativa accesible al drag and drop.
    element.addEventListener("click", () => {
      if (element.classList.contains("is-placed")) return;
      selectCard(element);
    });

    // El evento dragstart guarda el id, no todo el objeto. Así el drop solo
    // necesita buscar la tarjeta existente en el DOM.
    element.addEventListener("dragstart", (event) => {
      if (element.classList.contains("is-placed")) {
        event.preventDefault();
        return;
      }
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
      setFeedback("info", "Tarjeta seleccionada. Ahora elige la columna que le corresponde.");
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

  /** Precisión: aciertos sobre el total de intentos realizados. */
  function accuracy() {
    const attempts = placedCount + errorCount;
    return attempts === 0 ? 100 : Math.round((placedCount / attempts) * 100);
  }

  function updateScore() {
    const score = document.querySelector("#simulator-score");
    const bankCount = document.querySelector("#bank-count");
    const errors = document.querySelector("#simulator-errors");
    const hints = document.querySelector("#simulator-hints");
    const accuracyEl = document.querySelector("#simulator-accuracy");

    if (score) score.textContent = `${placedCount}/${CARDS.length}`;
    if (errors) errors.textContent = String(errorCount);
    if (hints) hints.textContent = String(hintCount);
    if (accuracyEl) accuracyEl.textContent = `${accuracy()}%`;
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

    if (!cardElement || !card || cardElement.classList.contains("is-placed")) return;
    if (startedAt === null) startedAt = Date.now();

    if (card.type !== zone.dataset.slot) {
      errorCount += 1;
      updateScore();
      markZoneAsWrong(zone);
      setFeedback("error", `Aún no: “${card.title}” no pertenece a ${SLOT_NAMES[zone.dataset.slot]}. ${card.hint}`);
      return;
    }

    const content = zone.querySelector(".drop-zone-content");
    content.appendChild(cardElement);
    cardElement.classList.remove("is-selected", "is-dragging");
    cardElement.classList.add("is-placed");
    cardElement.draggable = false;
    // No se usa `disabled`: desactivar un botón enfocado devuelve el foco al
    // body y el usuario de teclado pierde su posición. Se neutraliza con
    // aria-disabled y se saca del orden de tabulación.
    cardElement.setAttribute("aria-disabled", "true");
    cardElement.tabIndex = -1;
    cardElement.setAttribute("aria-label", `${card.title}. Ubicada en ${SLOT_NAMES[card.type]}.`);
    cardElement.querySelector(".chip-letter").textContent = card.letter;
    selectedCardId = null;
    zone.classList.add("has-card", "is-correct");
    placedCount += 1;
    updateScore();
    // Devolver el foco a la columna mantiene el contexto de teclado.
    if (document.activeElement === document.body || document.activeElement === cardElement) zone.focus();

    if (placedCount === CARDS.length) {
      finishChallenge();
    } else {
      setFeedback("success", `Correcto: ${card.title} → ${SLOT_NAMES[card.type]}. ${card.why} Llevas ${placedCount} de ${CARDS.length}.`);
    }
  }

  /** Código corto y reproducible que identifica el intento en la evidencia. */
  function buildVerificationCode(seconds) {
    const base = `${placedCount}${errorCount}${hintCount}${seconds}`;
    let checksum = 0;
    for (let index = 0; index < base.length; index += 1) {
      checksum = (checksum * 31 + base.charCodeAt(index)) % 46656;
    }
    return `SIPOC-${placedCount}${CARDS.length}-E${errorCount}-P${hintCount}-${checksum.toString(36).toUpperCase().padStart(3, "0")}`;
  }

  function readBestAttempt() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveBestAttempt(attempt) {
    const previous = readBestAttempt();
    const isBetter =
      !previous ||
      attempt.errors < previous.errors ||
      (attempt.errors === previous.errors && attempt.hints < previous.hints);

    if (!isBetter) return previous;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    } catch (error) {
      // Modo privado o almacenamiento bloqueado: el reto sigue funcionando.
    }
    return attempt;
  }

  const MATRIX_SLOTS = ["supplier", "input", "process", "output", "customer", "none"];

  /** Matriz en texto plano lista para pegar en el documento del proyecto. */
  function buildMatrixText(code) {
    const lines = ["Matriz SIPOC — Proceso: solicitud de software", ""];

    MATRIX_SLOTS.forEach((slot) => {
      const items = CARDS.filter((card) => card.type === slot).map((card) => card.title);
      lines.push(`${SLOT_NAMES[slot]}: ${items.join(" | ")}`);
    });

    lines.push("", "Justificación de cada elemento:");
    CARDS.forEach((card) => lines.push(`- ${card.title} (${SLOT_NAMES[card.type]}): ${card.why}`));
    lines.push("", `Código de verificación: ${code}`);
    return lines.join("\n");
  }

  /**
   * Dibuja la matriz resuelta con la justificación de cada elemento. Cerrar el
   * reto explicando el porqué convierte el acierto en criterio transferible.
   */
  function renderMatrixTable() {
    const container = document.querySelector("#summary-matrix");
    if (!container) return;

    const rows = MATRIX_SLOTS.map((slot) => {
      const items = CARDS.filter((card) => card.type === slot)
        .map((card) => `<li><strong>${card.title}</strong><span>${card.why}</span></li>`)
        .join("");
      return `<tr><th scope="row">${SLOT_NAMES[slot]}</th><td><ul class="matrix-items">${items}</ul></td></tr>`;
    }).join("");

    container.innerHTML = `
      <table class="matrix-table">
        <caption>Matriz SIPOC del proceso de solicitud de software</caption>
        <thead><tr><th scope="col">Componente</th><th scope="col">Elementos y justificación</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function finishChallenge() {
    const seconds = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const code = buildVerificationCode(seconds);
    const attempt = { errors: errorCount, hints: hintCount, accuracy: accuracy(), seconds: seconds, code: code };
    const best = saveBestAttempt(attempt);

    setFeedback("success", `¡Matriz completa! ${CARDS.length}/${CARDS.length} clasificadas con ${accuracy()}% de precisión.`);

    const summary = document.querySelector("#simulator-summary");
    if (summary) {
      summary.hidden = false;
      const set = (selector, value) => {
        const node = summary.querySelector(selector);
        if (node) node.textContent = value;
      };
      set("#summary-accuracy", `${attempt.accuracy}%`);
      set("#summary-errors", String(attempt.errors));
      set("#summary-hints", String(attempt.hints));
      set("#summary-time", `${seconds} s`);
      set("#summary-code", code);
      const bestNode = summary.querySelector("#summary-best");
      if (bestNode) {
        bestNode.textContent =
          best && best.code !== code
            ? `Tu mejor intento sigue siendo ${best.errors} ${best.errors === 1 ? "error" : "errores"} y ${best.hints} ${best.hints === 1 ? "pista" : "pistas"}.`
            : "Este es tu mejor intento hasta ahora.";
      }
      summary.dataset.matrix = buildMatrixText(code);
      renderMatrixTable();
      summary.focus();
    }

    window.dispatchEvent(new CustomEvent("sipoc:complete", { detail: attempt }));
  }

  function copyMatrix() {
    const summary = document.querySelector("#simulator-summary");
    const status = document.querySelector("#summary-copy-status");
    if (!summary || !summary.dataset.matrix) return;

    const text = summary.dataset.matrix;
    const report = (message) => {
      if (status) status.textContent = message;
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => report("Matriz copiada al portapapeles."),
        () => report("No se pudo copiar. Selecciona el texto del resumen manualmente.")
      );
      return;
    }

    // Respaldo para archivos abiertos con file:// donde el portapapeles falla.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "readonly");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(area);
    report(copied ? "Matriz copiada al portapapeles." : "No se pudo copiar. Selecciona el texto del resumen manualmente.");
  }

  function getDraggedCardId(event) {
    return event.dataTransfer ? event.dataTransfer.getData("text/plain") : selectedCardId;
  }

  function bindDropZone(zone) {
    // dragover debe cancelar su comportamiento por defecto para permitir drop.
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      zone.classList.add("is-over");
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
    if (!card) return;

    hintCount += 1;
    hintsByCard[card.id] = (hintsByCard[card.id] || 0) + 1;
    updateScore();

    // Primera pista: pregunta para razonar. Segunda: ayuda explícita.
    const text = hintsByCard[card.id] === 1 ? card.hint : card.hintDeep;
    setFeedback("info", `Pista sobre “${card.title}”: ${text}`);
  }

  function resetSimulator() {
    const bank = document.querySelector("#bank-cards");
    const zones = document.querySelectorAll(".drop-zone");
    const summary = document.querySelector("#simulator-summary");
    if (!bank) return;

    bank.innerHTML = "";
    zones.forEach((zone) => {
      zone.classList.remove("has-card", "is-correct", "is-wrong", "is-over");
      zone.querySelector(".drop-zone-content").innerHTML = "";
    });

    if (summary) {
      summary.hidden = true;
      delete summary.dataset.matrix;
      const status = summary.querySelector("#summary-copy-status");
      if (status) status.textContent = "";
      const matrix = summary.querySelector("#summary-matrix");
      if (matrix) matrix.innerHTML = "";
    }

    shuffle(CARDS).forEach((card) => bank.appendChild(createCardElement(card)));
    selectedCardId = null;
    placedCount = 0;
    errorCount = 0;
    hintCount = 0;
    hintsByCard = {};
    startedAt = null;
    updateScore();
    setFeedback("info", "Selecciona una tarjeta para comenzar.");
  }

  function showStoredBest() {
    const best = readBestAttempt();
    const badge = document.querySelector("#simulator-best");
    if (!badge || !best) return;

    badge.hidden = false;
    badge.textContent = `Mejor intento previo: ${best.accuracy}% de precisión · ${best.errors} ${best.errors === 1 ? "error" : "errores"}`;
  }

  function initSimulator() {
    const bank = document.querySelector("#bank-cards");
    const zones = document.querySelectorAll(".drop-zone");
    if (!bank || !zones.length) return;

    zones.forEach(bindDropZone);
    document.querySelector("#simulator-hint")?.addEventListener("click", showHint);
    document.querySelector("#simulator-reset")?.addEventListener("click", resetSimulator);
    document.querySelector("#summary-copy")?.addEventListener("click", copyMatrix);
    resetSimulator();
    showStoredBest();
  }

  // Exponemos una pequeña API para que el archivo pueda reiniciarse desde la
  // consola del navegador durante una clase o una demostración.
  window.SIPOCSimulator = { init: initSimulator, reset: resetSimulator, cards: CARDS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSimulator);
  } else {
    initSimulator();
  }
})();
