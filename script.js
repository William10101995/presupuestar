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

  // Dibuja un rectángulo que encuadre todo el contenido (margen de 10 mm)
  doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

  // ----------------------
  // ENCABEZADO
  // ----------------------
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

  // ----------------------
  // DATOS DEL EMISOR (ENCUADRADOS)
  // ----------------------
  doc.setFontSize(10);
  const emitterX = margin + 5;
  const emitterY = 42;
  const emitterWidth = 90;
  const emitterHeight = 35;
  doc.rect(emitterX, emitterY, emitterWidth, emitterHeight);

  // Función auxiliar para escribir indicador y dato en línea (continuado)
  const writeLine = (x, y, label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.text(value, x + labelWidth, y);
  };

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

  // ----------------------
  // DATOS DEL CLIENTE (ENCUADRADOS)
  // ----------------------
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

  // ----------------------
  // TABLA DE ÍTEMS
  // ----------------------
  // Configuramos la cabecera y generamos la matriz de filas
  const tableStartY = emitterY + emitterHeight + 15;
  const headers = ["Descripción", "Unidades", "Precio Unitario", "Total"];
  const rows = [];
  document.querySelectorAll("#itemsBody tr").forEach((row) => {
    rows.push([
      row.querySelector(".item-desc").value,
      row.querySelector(".item-units").value,
      //agregar coma y dos decimales al final

      "$" + row.querySelector(".item-price").value + ",00",

      row.querySelector(".item-total").textContent,
    ]);
  });

  // Usamos overflow: "linebreak" para que textos largos se dividan en líneas.
  const tableStyles = { fontSize: 10, overflow: "linebreak" };

  // ----------------------PAGINACION ESPECIAL PARA EL TRANSPORTE ----------------------
  // Función para estimar la altura de una fila basándose en la columna de "Descripción"
  // Se asume que la descripción es la primera celda del array (índice 0)
  // Puedes ajustar "descColWidth" (ancho asignado a esa columna) y "lineHeight" (altura por línea) según tu diseño.
  function estimateRowHeight(row, descColWidth, doc) {
    const description = row[0] || "";
    // Establecemos un valor base para la altura mínima de la fila
    const minHeight = 10; // mm
    // Definimos el alto aproximado de una línea (puede variar según la fuente y tamaño)
    const lineHeight = 5; // mm por línea (ajustá este valor según corresponda)
    // Calculamos el ancho total del texto
    const textWidth = doc.getTextWidth(description);
    // Calculamos cuántas líneas ocupará el texto según el ancho disponible para la columna
    const lines = Math.ceil(textWidth / descColWidth);
    // La altura estimada es la cantidad de líneas por el alto de línea, más un pequeño padding (2 mm)
    const estHeight = lines * lineHeight + 2;
    return Math.max(estHeight, minHeight);
  }

  // --- Cálculo y división de filas para paginación ---
  // Variables ya definidas:

  // "reservedBottom" es el espacio que se reserva en la parte inferior para totales u otros elementos.
  const reservedBottom = 50; // mm (ajusta según necesites)

  // El espacio vertical disponible para filas en la primera página:
  const availableRowsHeight =
    pageHeight - margin - reservedBottom - tableStartY;

  // Estimamos la altura consumida por las filas para determinar el corte.
  // "descColWidth" es el ancho estimado (en mm) de la columna de descripción.
  // Este valor depende del ancho que le asignes a la columna de descripción en tu tabla.
  const descColWidth = 80; // mm (ajusta según corresponda)

  let cumulativeHeight = 0;
  let firstPageRows = [];
  let remainingRows = [];

  // "rows" es el array de arrays con los datos de cada fila, generado previamente.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const estRowHeight = estimateRowHeight(row, descColWidth, doc);
    // Si al agregar esta fila no se supera el espacio disponible, se incluye en la primera página
    if (cumulativeHeight + estRowHeight <= availableRowsHeight) {
      firstPageRows.push(row);
      cumulativeHeight += estRowHeight;
    } else {
      // Si la fila actual haría exceder el espacio, separamos a partir de aquí
      remainingRows = rows.slice(i);
      break;
    }
  }

  // Ahora, si quedan filas para una nueva página, se inserta el ítem "Transporte" al inicio de la segunda parte.
  if (remainingRows.length > 0) {
    // Se calcula el subtotal de la primera página. Se asume que la columna "Total" es el índice 3.
    let sumFirstPage = 0;
    firstPageRows.forEach((r) => {
      // Se eliminan símbolos y se transforma la coma decimal a punto.
      let totalText = r[3]
        .replace("$", "")
        .replace(/\./g, "")
        .replace(",", ".");
      sumFirstPage += parseFloat(totalText);
    });
    const formattedSumFirstPage =
      "$" +
      sumFirstPage.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    // Se crea la fila "Transporte" con cantidad "1" y, tanto en "Precio Unitario" como en "Total", el subtotal.
    const transporteRow = [
      "Transporte",
      "1",
      formattedSumFirstPage,
      formattedSumFirstPage,
    ];
    // Se inserta al inicio de las filas restantes.
    remainingRows.unshift(transporteRow);

    // Imprimir la primera parte de la tabla (en la primera página):
    doc.autoTable({
      startY: tableStartY,
      head: [headers],
      body: firstPageRows,
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [255, 255, 255], textColor: 0 },
      margin: { left: margin + 5, right: margin + 5 },
    });

    // Crear una nueva página e imprimir la segunda parte (con la fila "Transporte" incluida):
    doc.addPage();
    doc.autoTable({
      startY: margin + 10,
      head: [headers],
      body: remainingRows,
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [255, 255, 255], textColor: 0 },
      margin: { left: margin + 5, right: margin + 5 },
    });

    // Se define la posición final para dibujar totales u otros elementos.
    var finalY = doc.lastAutoTable.finalY + 15;
  } else {
    // Si todas las filas caben en una sola página, se imprime la tabla completa.
    doc.autoTable({
      startY: tableStartY,
      head: [headers],
      body: rows,
      theme: "grid",
      styles: tableStyles,
      headStyles: { fillColor: [255, 255, 255], textColor: 0 },
      margin: { left: margin + 5, right: margin + 5 },
    });
    var finalY = doc.lastAutoTable.finalY + 15;
  }
  // ----------------------PAGINACION ESPECIAL PARA EL TRANSPORTE ----------------------

  // ----------------------
  // TOTALES Y FORMA DE PAGO
  // ----------------------
  // Extraer y calcular totales globales
  const totalBrutoStr = document
    .getElementById("totalBruto")
    .textContent.replace(/[$.]/g, "")
    .replace(",", ".");
  const totalBruto = parseFloat(totalBrutoStr) || 0;
  const ivaPercent =
    parseFloat(document.getElementById("ivaPercent").value) || 0;
  const iva = totalBruto * (ivaPercent / 100);
  const totalPresupuesto = totalBruto + iva;

  // Función auxiliar para escribir totales alineados a la derecha de forma continua
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

  // ----------------------
  // FIRMA
  // ----------------------
  finalY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("________________________", 140, finalY);
  doc.text("Firma y Sello del Proveedor", 140, finalY + 6);

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
