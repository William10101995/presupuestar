fetch("localidades.json")
  .then((response) => response.json())
  .then((data) => {
    const localidades = data.localidades;
    const provinciasUnicas = new Map();

    // Obtener las provincias sin duplicados usando el nombre como clave
    localidades.forEach((item) => {
      const provNombre = item.provincia.nombre;
      if (!provinciasUnicas.has(provNombre)) {
        provinciasUnicas.set(provNombre, provNombre);
      }
    });

    // Convertir Map a un array y ordenar alfabéticamente por nombre de provincia
    const provinciasOrdenadas = [...provinciasUnicas.keys()].sort((a, b) =>
      a.localeCompare(b)
    );

    const selectProvincia = document.getElementById("clienteProvincia");

    // Agregar opciones de provincias ordenadas, usando el nombre como value y texto
    provinciasOrdenadas.forEach((nombre) => {
      const option = document.createElement("option");
      option.value = nombre;
      option.textContent = nombre;
      selectProvincia.appendChild(option);
    });

    const selectLocalidad = document.getElementById("clienteCiudad");

    selectProvincia.addEventListener("change", function () {
      const provinciaSeleccionada = this.value;
      selectLocalidad.innerHTML =
        '<option value="">Seleccione localidad</option>';
      const feedbackProvincia = this.nextElementSibling;

      if (!provinciaSeleccionada) {
        feedbackProvincia.textContent = "× Obligatorio";
        feedbackProvincia.style.color = "red";
        this.style.borderColor = "red"; // Marcar el borde en rojo
      } else {
        feedbackProvincia.textContent = "✓ Excelente";
        feedbackProvincia.style.color = "green";
        this.style.borderColor = "green"; // Marcar el borde en verde

        // Filtrar y ordenar localidades alfabéticamente usando el nombre de la provincia
        const localidadesFiltradas = localidades
          .filter((item) => item.provincia.nombre === provinciaSeleccionada)
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        localidadesFiltradas.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.nombre; // Guardamos el nombre en el value
          option.textContent = item.nombre;
          selectLocalidad.appendChild(option);
        });
      }

      // Limpiar feedback de localidad si ya se eligió provincia
      const feedbackLocalidad = selectLocalidad.nextElementSibling;
      feedbackLocalidad.textContent = "";
      selectLocalidad.style.borderColor = ""; // Restablecer borde de localidad
    });

    selectLocalidad.addEventListener("change", function () {
      const localidadSeleccionada = this.value;
      const feedbackLocalidad = this.nextElementSibling;

      if (!localidadSeleccionada) {
        feedbackLocalidad.textContent = "× Obligatorio";
        feedbackLocalidad.style.color = "red";
        this.style.borderColor = "red"; // Marcar el borde en rojo
      } else {
        feedbackLocalidad.textContent = "✓ Excelente";
        feedbackLocalidad.style.color = "green";
        this.style.borderColor = "green"; // Marcar el borde en verde
      }
    });
  })
  .catch((error) => console.error("Error al cargar el JSON:", error));

// Evitar caracteres no numéricos en inputs de tipo number (excepto para precios que admiten punto)
document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener("input", function () {
    const allowDecimal = this.step && this.step != "1";
    let regex = allowDecimal ? /[^\d.]/g : /[^\d]/g;
    this.value = this.value.replace(regex, "");
    if (allowDecimal && (this.value.match(/\./g) || []).length > 1) {
      this.value = this.value.substring(0, this.value.lastIndexOf("."));
    }
  });
});

function formatearNumero(input) {
  // Elimina cualquier carácter no numérico
  let valor = input.value.replace(/\./g, "").replace(/[^0-9]/g, "");

  // Si el valor no es válido, no lo procesa
  if (!valor) {
    input.value = "";
    return;
  }

  // Agrega puntos como separadores de miles
  valor = parseInt(valor).toLocaleString("es-AR");

  // Actualiza el valor del input
  input.value = valor;
}

document.querySelectorAll(".item-price").forEach((input) => {
  input.addEventListener("input", function () {
    formatCurrencyInput(this);
    updateTotals(); // Actualiza los totales en tiempo real
  });
});

function parseCurrency(value) {
  if (!value) return 0;
  // Elimina los puntos (separadores de miles) y reemplaza la coma decimal por punto
  value = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(value);
}

// Función para actualizar los totales y agregar el signo "$" con separador de miles.
function updateTotals() {
  let totalBruto = 0;
  document.querySelectorAll("#itemsBody tr").forEach((row) => {
    const units = parseFloat(row.querySelector(".item-units").value) || 0;
    const price = parseCurrency(row.querySelector(".item-price").value) || 0;
    const total = units * price;
    row.querySelector(".item-total").textContent =
      "$" +
      total.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    totalBruto += total;
  });

  const ivaPercent =
    parseFloat(document.getElementById("ivaPercent").value) || 0;
  const iva = totalBruto * (ivaPercent / 100);
  const totalPresupuesto = totalBruto + iva;

  document.getElementById("totalBruto").textContent =
    "$" +
    totalBruto.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  document.getElementById("totalPresupuesto").textContent =
    "$" +
    totalPresupuesto.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}

// Función para agregar una nueva fila de item
function addItem() {
  const newRow = document.createElement("tr");
  newRow.innerHTML = `
	  <td><input type="text" class="item-desc" placeholder="Descripción del item" required><div class="feedback-message"></div></td>
	  <td><input type="number" class="item-units" min="0" value="1" required><div class="feedback-message"></div></td>
	  <td>
	    <div class="input-with-symbol">
	      <input type="text" class="item-price" min="0" step="0.01" value="0" oninput="formatearNumero(this)" required>
        <div class="feedback-message"></div>
	    </div>
	  </td>
	  <td class="item-total">$0.00</td>
	  <td><button class="btn remove-btn">Eliminar</button></td>
	`;
  document.getElementById("itemsBody").appendChild(newRow);
  addEventListenersToInputs(newRow);
  updateTotals();
}

// Asigna los listeners a los inputs de una fila
function addEventListenersToInputs(row) {
  row.querySelectorAll(".item-units, .item-price").forEach((input) => {
    input.addEventListener("input", updateTotals);
  });
  row.querySelector(".remove-btn").addEventListener("click", () => {
    row.remove();
    updateTotals();
  });
  // Validación visual en tiempo real para los campos de los items
  row
    .querySelectorAll(".item-desc, .item-units, .item-price")
    .forEach((input) => {
      input.addEventListener("input", () => checkField(input));
    });
}

// Función para validar y marcar cada campo (rojo si está vacío, verde si completo)
function checkField(field) {
  const parentContainer = field.closest("td") || field.parentElement;
  const feedback = parentContainer.querySelector(".feedback-message");

  if (!field.value || field.value.trim() === "") {
    field.style.border = "2px solid red";
    if (feedback) {
      feedback.textContent = "× Obligatorio";
      feedback.style.color = "red";
      feedback.style.display = "block"; // Mostrar siempre el mensaje de error
    }
  } else {
    field.style.border = "2px solid green";
    if (feedback) {
      feedback.textContent = "✓ Excelente";
      feedback.style.color = "green";
      feedback.style.display = "block"; // Mostrar siempre el mensaje de éxito
    }
  }
}

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("focus", () => checkField(input));
  input.addEventListener("input", () => checkField(input));
});

// Validación de campos sin alertas
function validateFields() {
  let valid = true;

  // Validar campos obligatorios generales
  const requiredFields = [
    "numeroPresupuesto",
    "fechaPresupuesto",
    "emisorRazonSocial",
    "emisorCuit",
    "emisorDomicilio",
    "emisorIva",
    "clienteRazonSocial",
    "clienteDireccion",
    "clienteCiudad",
    "clienteProvincia",
    "clienteCuit",
    "formaPago",
    "ivaPercent",
  ];

  requiredFields.forEach((id) => {
    const field = document.getElementById(id);
    if (field) {
      checkField(field); // Llamar a checkField para manejar bordes y leyendas
      if (!field.value || field.value.trim() === "") {
        valid = false;
      }
    }
  });

  // Validar que cada item tenga descripción, unidades y precio
  const items = document.querySelectorAll("#itemsBody tr");
  if (items.length === 0) {
    valid = false;
  }
  items.forEach((row) => {
    const desc = row.querySelector(".item-desc");
    const units = row.querySelector(".item-units");
    const price = row.querySelector(".item-price");

    [desc, units, price].forEach((field) => {
      if (field) {
        checkField(field); // Llamar a checkField para manejar bordes y leyendas
        if (!field.value || field.value.trim() === "") {
          valid = false;
        }
      }
    });
  });

  return valid;
}

// Función para generar el PDF (sólo se ejecuta si todos los campos son válidos)
function generatePDF() {
  const warningMessage = document.getElementById("warningMessage");

  if (!validateFields()) {
    // Mostrar el mensaje con estilo
    warningMessage.style.display = "flex";
    warningMessage.textContent =
      "Por favor, completa todos los campos antes de descargar el PDF.";
    return; // Salir sin generar el PDF
  }

  // Ocultar el mensaje si todo está correcto
  warningMessage.style.display = "none";

  // Crear el documento en A4 (210 x 297 mm)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // Variables de página y márgenes
  const margin = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Función para agregar encabezado y datos del emisor y cliente
  const addHeader = () => {
    // Dibuja un rectángulo que encuadre todo el contenido (margen de 10 mm)
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Título en negrita centrado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("PRESUPUESTO", pageWidth / 2, 20, { align: "center" });

    // Dibujar la "X" en negrita y enmarcada
    doc.setFontSize(24);
    const xText = "X";
    const xPosY = 30;
    doc.text(xText, pageWidth / 2, xPosY, { align: "center" });
    const xWidth = doc.getTextWidth(xText);
    const xHeight = 10; // altura aproximada del texto
    const xBoxPadding = 2;
    const xBoxX = pageWidth / 2 - xWidth / 2 - xBoxPadding;
    const xBoxY = xPosY - 5 - xBoxPadding;
    const xBoxWidth = xWidth + 2 * xBoxPadding;
    const xBoxHeight = xHeight + 2 * xBoxPadding;
    doc.rect(xBoxX, xBoxY, xBoxWidth, xBoxHeight);

    // Leyenda debajo de la "X" (separa 4 mm después del recuadro)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "DOCUMENTO NO VÁLIDO COMO FACTURA",
      pageWidth / 2,
      xBoxY + xBoxHeight + 4,
      { align: "center" }
    );

    // Datos del emisor
    doc.setFontSize(10);
    const emitterX = margin + 5;
    const emitterY = 42;
    const emitterWidth = 90;
    const emitterHeight = 35;
    doc.rect(emitterX, emitterY, emitterWidth, emitterHeight);

    let textX = emitterX + 3;
    let textY = emitterY + 7;
    const lineSpacing = 6;
    writeLine(
      textX,
      textY,
      "Presupuesto N°: ",
      document.getElementById("numeroPresupuesto").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Emisor: ",
      document.getElementById("emisorRazonSocial").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Domicilio: ",
      document.getElementById("emisorDomicilio").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Condición IVA: ",
      document.getElementById("emisorIva").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "CUIT: ",
      document.getElementById("emisorCuit").value
    );

    // Datos del cliente
    const clientWidth = 90;
    const clientHeight = 35;
    const clientX = pageWidth - margin - clientWidth - 5;
    const clientY = 42;
    doc.rect(clientX, clientY, clientWidth, clientHeight);

    textX = clientX + 3;
    textY = clientY + 7;
    writeLine(
      textX,
      textY,
      "Cliente: ",
      document.getElementById("clienteRazonSocial").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Dirección: ",
      document.getElementById("clienteDireccion").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Ciudad: ",
      document.getElementById("clienteCiudad").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "Provincia: ",
      document.getElementById("clienteProvincia").value
    );
    textY += lineSpacing;
    writeLine(
      textX,
      textY,
      "CUIT: ",
      document.getElementById("clienteCuit").value
    );
  };

  // Función auxiliar para escribir indicador y dato en línea (continuado)
  const writeLine = (x, y, label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + labelWidth, y);
  };

  // Función para agregar totales al pie de la página
  const addFooter = (finalY, totalBruto, ivaPercent, iva, totalPresupuesto) => {
    const writeTotalLine = (y, label, value) => {
      doc.setFont("helvetica", "bold");
      const labelWidth = doc.getTextWidth(label);
      doc.setFont("helvetica", "normal");
      const valueText =
        "$" +
        value.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      const valueWidth = doc.getTextWidth(valueText);
      const totalTextWidth = labelWidth + valueWidth;
      const startX = pageWidth - margin - totalTextWidth - 6;
      doc.setFont("helvetica", "bold");
      doc.text(label, startX, y);
      doc.setFont("helvetica", "normal");
      doc.text(valueText, startX + labelWidth, y);
    };

    writeTotalLine(finalY, "TOTAL BRUTO: ", totalBruto);
    finalY += 6;
    writeTotalLine(finalY, `IVA (${ivaPercent}%): `, iva);
    finalY += 6;
    writeTotalLine(finalY, "TOTAL PRESUPUESTO: ", totalPresupuesto);

    // Forma de pago (alineado a la izquierda)
    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Forma de Pago: ", margin + 5, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(
      document.getElementById("formaPago").value,
      margin + 6 + doc.getTextWidth("Forma de Pago: "),
      finalY
    );

    // Firma
    finalY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("________________________", 140, finalY);
    doc.text("Firma y Sello del Proveedor", 140, finalY + 6);
  };

  // Configuramos la cabecera y generamos la matriz de filas
  const headers = ["Descripción", "Unidades", "Precio Unitario", "Total"];
  const rows = [];
  document.querySelectorAll("#itemsBody tr").forEach((row) => {
    rows.push([
      row.querySelector(".item-desc").value,
      row.querySelector(".item-units").value,
      "$" + row.querySelector(".item-price").value + ",00",
      row.querySelector(".item-total").textContent,
    ]);
  });

  // Usamos overflow: "linebreak" para que textos largos se dividan en líneas.
  const tableStyles = { fontSize: 10, overflow: "linebreak" };

  // Función para estimar la altura de una fila basándose en la columna de "Descripción"
  function estimateRowHeight(row, descColWidth, doc) {
    const description = row[0] || "";
    const minHeight = 10; // mm
    const lineHeight = 5; // mm por línea (ajustá este valor según corresponda)
    const textWidth = doc.getTextWidth(description);
    const lines = Math.ceil(textWidth / descColWidth);
    const estHeight = lines * lineHeight + 2;
    return Math.max(estHeight, minHeight);
  }

  // Variables para paginación
  const reservedBottom = 50; // mm (ajusta según necesites)
  const descColWidth = 80; // mm (ajusta según corresponda)
  let cumulativeHeight = 0;
  let firstPageRows = [];
  let remainingRows = [];
  let totalBruto = 0;

  // Estimamos la altura consumida por las filas para determinar el corte.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const estRowHeight = estimateRowHeight(row, descColWidth, doc);
    if (
      cumulativeHeight + estRowHeight <=
      pageHeight - margin - reservedBottom - 90
    ) {
      // Ajuste de espacio
      firstPageRows.push(row);
      cumulativeHeight += estRowHeight;
    } else {
      remainingRows = rows.slice(i);
      break;
    }
  }

  // Función para calcular totales
  const calculateTotals = (rows) => {
    let total = 0;
    rows.forEach((r) => {
      if (r[0] === "Transporte") return; // ← Ignora la fila de Transporte
      let totalText = r[3]
        .replace("$", "")
        .replace(/\./g, "")
        .replace(",", ".");
      total += parseFloat(totalText);
    });
    return total;
  };

  // Función para agregar una nueva página con encabezado, tabla y pie de página
  const addPage = (rows, isFirstPage = false) => {
    if (!isFirstPage) {
      doc.addPage();
    }
    addHeader();
    doc.autoTable({
      startY: 90, // Ajuste de espacio
      head: [headers],
      body: rows,
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [255, 255, 255], textColor: 0 },
      margin: { left: margin + 5, right: margin + 5 },
    });
    const finalY = doc.lastAutoTable.finalY + 15;
    const ivaPercent =
      parseFloat(document.getElementById("ivaPercent").value) || 0;
    const iva = totalBruto * (ivaPercent / 100);
    const totalPresupuesto = totalBruto + iva;
    addFooter(finalY, totalBruto, ivaPercent, iva, totalPresupuesto);
  };

  // Agregar la primera página
  totalBruto += calculateTotals(firstPageRows);
  addPage(firstPageRows, true);

  // Agregar "Transporte" SOLO UNA VEZ si hay múltiples páginas
  if (remainingRows.length > 0) {
    const transporteRow = [
      "Transporte",
      "1",
      "$" +
        totalBruto.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      "$" +
        totalBruto.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    ];
    remainingRows.unshift(transporteRow); // ← Se añade una sola vez
  }

  // Agregar páginas restantes SIN añadir "Transporte" de nuevo
  while (remainingRows.length > 0) {
    cumulativeHeight = 0;
    firstPageRows = [];
    for (let i = 0; i < remainingRows.length; i++) {
      const row = remainingRows[i];
      const estRowHeight = estimateRowHeight(row, descColWidth, doc);
      if (
        cumulativeHeight + estRowHeight <=
        pageHeight - margin - reservedBottom - 90
      ) {
        firstPageRows.push(row);
        cumulativeHeight += estRowHeight;
      } else {
        remainingRows = remainingRows.slice(i);
        break;
      }
      // Si llegamos al final sin cortar, remainingRows queda vacío
      if (i === remainingRows.length - 1) {
        remainingRows = [];
      }
    }
    totalBruto += calculateTotals(firstPageRows);
    addPage(firstPageRows);
  }

  // Guardar el PDF
  doc.save(
    `Presupuesto-${document.getElementById("numeroPresupuesto").value}.pdf`
  );
}

// Asignar listeners para actualizar totales y eliminar items
document.getElementById("ivaPercent").addEventListener("input", updateTotals);
document.querySelectorAll(".item-units, .item-price").forEach((input) => {
  input.addEventListener("input", updateTotals);
});
document.querySelectorAll(".remove-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest("tr").remove();
    updateTotals();
  });
});

// Agregar validación en tiempo real a los campos obligatorios
const requiredFields = [
  "numeroPresupuesto",
  "fechaPresupuesto",
  "emisorRazonSocial",
  "emisorCuit",
  "emisorDomicilio",
  "emisorIva",
  "clienteRazonSocial",
  "clienteDireccion",
  "clienteCiudad",
  "clienteProvincia",
  "clienteCuit",
  "formaPago",
  "ivaPercent",
];
requiredFields.forEach((id) => {
  const field = document.getElementById(id);
  const eventType =
    field.tagName.toLowerCase() === "select" ? "change" : "input";
  field.addEventListener(eventType, () => checkField(field));
});

// Inicialización: agregar eventos a la fila inicial y actualizar totales
addEventListenersToInputs(document.querySelector("#itemsBody tr"));
updateTotals();

function updateCharCounter(input) {
  const counter = input.parentElement.querySelector(".char-counter");
  const currentLength = input.value.length;
  const maxLength = input.getAttribute("maxlength");

  // Mostrar solo si hay contenido
  if (currentLength > 0) {
    counter.textContent = `${currentLength}/${maxLength}`;
    counter.style.opacity = "1";

    // Cambiar color si se acerca al límite
    counter.style.color =
      currentLength >= maxLength * 0.9 ? "#e67e22" : "#7f8c8d";
  } else {
    counter.textContent = "";
    counter.style.opacity = "0";
  }
}

// Inicialización al cargar
document.querySelectorAll("input[maxlength]").forEach((input) => {
  input.addEventListener("input", () => updateCharCounter(input));
});

// JavaScript
function validarLongitud(input) {
  const maxLength = 11;
  const currentValue = input.value.replace(/\D/g, ""); // Eliminar no numéricos
  const currentLength = currentValue.length;

  // Limitar a 11 dígitos
  if (currentLength > maxLength) {
    input.value = currentValue.slice(0, maxLength);
    return;
  }

  // Actualizar contador
  const counter = input.parentElement.querySelector(".char-counter");
  counter.textContent =
    currentLength > 0 ? `${currentLength}/${maxLength}` : "";

  // Validación visual
  const feedback = input.nextElementSibling;
  if (currentLength < maxLength) {
    input.setCustomValidity("CUIT debe tener 11 dígitos");
    showError(feedback, "Faltan dígitos");
  } else {
    input.setCustomValidity("");
    clearError(feedback);
  }

  // Validar formato argentino (opcional)
  if (currentLength === 11 && !validarFormatoCUIT(input.value)) {
    input.setCustomValidity("CUIT inválido");
    showError(feedback, "CUIT no válido");
  }
}
