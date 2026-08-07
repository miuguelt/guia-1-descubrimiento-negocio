(() => {
  "use strict";

  const techniquePlans = {
    interview: {
      label: "Entrevista semiestructurada",
      instrument: "Guion con apertura, preguntas neutrales, excepciones y cierre de validación.",
      application: [
        "Solicitar consentimiento y explicar el uso de las notas.",
        "Preguntar por el flujo normal, las excepciones, las reglas y los tiempos tolerables.",
        "Resumir lo comprendido y pedir al actor que corrija interpretaciones."
      ],
      contrast: "Contrastar las respuestas con observación directa o un documento vigente."
    },
    survey: {
      label: "Cuestionario",
      instrument: "Formulario breve con población, muestra, preguntas cerradas y una escala con extremos definidos.",
      application: [
        "Definir la variable que se medirá y quién puede responder.",
        "Probar el cuestionario con pocas personas antes de distribuirlo.",
        "Calcular resultados y registrar sesgos o limitaciones de la muestra."
      ],
      contrast: "Contrastar la tendencia con cronometraje, registros o entrevistas."
    },
    observation: {
      label: "Observación directa",
      instrument: "Ficha con hora, actor, acción observable, duración, interrupción y evidencia.",
      application: [
        "Definir una franja representativa y observar sin corregir el trabajo.",
        "Registrar hechos visibles y separar las interpretaciones del observador.",
        "Repetir la observación antes de convertir un tiempo aislado en una meta."
      ],
      contrast: "Contrastar lo observado con el actor y con el procedimiento documentado."
    },
    document: {
      label: "Análisis documental",
      instrument: "Matriz de artefactos, campos, reglas, responsables, vigencia y contradicciones.",
      application: [
        "Confirmar que el documento está vigente y quién es su responsable.",
        "Inventariar campos, reglas y datos sensibles sin copiar información personal.",
        "Registrar vacíos y contradicciones como preguntas, no como requisitos aprobados."
      ],
      contrast: "Contrastar las reglas escritas con quien ejecuta el proceso y con evidencia de uso."
    },
    jad: {
      label: "Taller JAD",
      instrument: "Agenda y matriz de posiciones, evidencia, acuerdo, responsable y fecha.",
      application: [
        "Convocar a representantes con conocimiento y capacidad de decisión.",
        "Facilitar el diálogo usando evidencia y registrar también los desacuerdos.",
        "Cerrar con alcance, pendientes, responsables y próxima fecha de validación."
      ],
      contrast: "Validar el acta con todos los participantes antes de usar los acuerdos."
    }
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand("copy");
    helper.remove();
    if (!copied) throw new Error("No fue posible copiar el contenido.");
  };

  const announceCopy = (button, message, isError = false) => {
    const status = button.parentElement?.querySelector(".copy-status");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#d65a5a" : "";
    window.setTimeout(() => {
      status.textContent = "";
      status.style.color = "";
    }, 4500);
  };

  document.querySelectorAll("[data-copy-target]").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.getElementById(button.dataset.copyTarget || "");
      if (!target) return;

      try {
        await copyText(target.textContent.trim());
        announceCopy(button, "Plantilla copiada.");
      } catch {
        announceCopy(button, "No se pudo copiar. Selecciona el texto manualmente.", true);
      }
    });
  });

  const form = document.getElementById("collection-workbench");
  const result = document.getElementById("collection-result");
  const resultText = document.getElementById("collection-result-text");
  const formStatus = document.getElementById("collection-form-status");

  if (!form || !result || !resultText || !formStatus) return;

  const requiredFields = [...form.querySelectorAll("[required]")];

  requiredFields.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.value.trim()) field.removeAttribute("aria-invalid");
      formStatus.textContent = "";
    });
    field.addEventListener("change", () => {
      if (field.value.trim()) field.removeAttribute("aria-invalid");
      formStatus.textContent = "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const emptyFields = requiredFields.filter((field) => !field.value.trim());
    requiredFields.forEach((field) => field.removeAttribute("aria-invalid"));

    if (emptyFields.length) {
      emptyFields.forEach((field) => field.setAttribute("aria-invalid", "true"));
      formStatus.textContent = "Completa todos los campos para generar el plan.";
      emptyFields[0].focus();
      result.hidden = true;
      return;
    }

    const data = new FormData(form);
    const plan = techniquePlans[data.get("technique")];
    if (!plan) return;

    const steps = plan.application.map((step, index) => `${index + 1}. ${step}`).join("\n");
    resultText.textContent = `PLAN INICIAL DE RECOLECCIÓN Y ANÁLISIS\n\nPROYECTO: ${data.get("project")}\nPROCESO O PROBLEMA: ${data.get("problem")}\nFUENTE O ACTOR: ${data.get("source")}\nTÉCNICA: ${plan.label}\n\nOBJETIVO\n${data.get("objective")}\n\nEVIDENCIA ESPERADA\n${data.get("evidence")}\n\nINSTRUMENTO\n${plan.instrument}\n\nAPLICACIÓN PROPUESTA\n${steps}\n\nANÁLISIS POSTERIOR\n1. Depurar duplicados y datos no necesarios sin perder fuente ni fecha.\n2. Codificar cada idea como actor, dato, regla, evento, problema o calidad.\n3. Agrupar patrones y separar hechos, interpretaciones y preguntas.\n4. Registrar coincidencias y contradicciones en la matriz de análisis.\n5. Validar el hallazgo con la fuente o con un taller de consenso.\n\nTRIANGULACIÓN\n${plan.contrast}\n\nPAQUETE PARA LA GUÍA 2\n- Hallazgo consolidado: [completar después del análisis]\n- Actores: [roles, no nombres]\n- Datos candidatos: [conceptos, todavía no tablas]\n- Reglas candidatas: [condiciones]\n- Eventos y estados: [lista]\n- Calidad esperada: [atributo y métrica pendiente]\n- Preguntas abiertas: [lista]\n- Fuentes relacionadas: [IDs]\n\nCRITERIO DE CIERRE\nEl hallazgo queda identificado con dato bruto, código, categoría, fuente, contraste, decisión y estado de validación. Solo después podrá convertirse en requisito candidato.\n\nREGLA ÉTICA\nSolicitar autorización, recolectar únicamente datos necesarios y proteger la identidad de los participantes.`;

    result.hidden = false;
    formStatus.textContent = "";
    result.focus();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      requiredFields.forEach((field) => field.removeAttribute("aria-invalid"));
      formStatus.textContent = "";
      result.hidden = true;
      resultText.textContent = "";
    });
  });
})();
