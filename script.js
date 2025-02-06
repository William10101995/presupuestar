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

// Función para actualizar los totales y agregar el signo "$" con separador de miles.
function updateTotals() {
  let totalBruto = 0;
  document.querySelectorAll("#itemsBody tr").forEach((row) => {
    const units = parseFloat(row.querySelector(".item-units").value) || 0;
    const price = parseFloat(row.querySelector(".item-price").value) || 0;
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
	  <td><input type="text" class="item-desc" placeholder="Descripción del item" required></td>
	  <td><input type="number" class="item-units" min="0" value="1" required></td>
	  <td>
	    <div class="input-with-symbol">
	      <input type="number" class="item-price" min="0" step="0.01" value="0" required>
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
  if (!field.value || field.value.trim() === "") {
    field.style.border = "2px solid red";
  } else {
    field.style.border = "2px solid green";
  }
}

// Validación de campos sin alertas
function validateFields() {
  let valid = true;
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
    if (!field.value || field.value.trim() === "") {
      field.style.border = "2px solid red";
      valid = false;
    } else {
      field.style.border = "2px solid green";
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
    if (!desc.value || desc.value.trim() === "") {
      desc.style.border = "2px solid red";
      valid = false;
    } else {
      desc.style.border = "2px solid green";
    }
    if (!units.value || units.value.trim() === "") {
      units.style.border = "2px solid red";
      valid = false;
    } else {
      units.style.border = "2px solid green";
    }
    if (!price.value || price.value.trim() === "") {
      price.style.border = "2px solid red";
      valid = false;
    } else {
      price.style.border = "2px solid green";
    }
  });
  return valid;
}

// Función para generar el PDF (sólo se ejecuta si todos los campos son válidos)
function generatePDF() {
  if (!validateFields()) return;

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
  // Calcular dimensiones del texto y dibujar un rectángulo alrededor de la "X"
  const xWidth = doc.getTextWidth(xText);
  const xHeight = 10; // altura aproximada del texto
  const xBoxPadding = 2;
  const xBoxX = pageWidth / 2 - xWidth / 2 - xBoxPadding;
  const xBoxY = xPosY - 5 - xBoxPadding; // ajustar para centrar verticalmente
  const xBoxWidth = xWidth + 2 * xBoxPadding;
  const xBoxHeight = xHeight + 2 * xBoxPadding;
  doc.rect(xBoxX, xBoxY, xBoxWidth, xBoxHeight);

  // Colocar la leyenda "DOCUMENTO NO VÁLIDO COMO FACTURA" con separación suficiente
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  // Se ubica por debajo de la "X", dejando 4 mm de espacio
  doc.text(
    "DOCUMENTO NO VÁLIDO COMO FACTURA",
    pageWidth / 2,
    xBoxY + xBoxHeight + 4,
    { align: "center" }
  );

  // ----------------------
  // DATOS DEL EMISOR (ENCUADRADOS)
  // ----------------------
  // Ubicación y dimensiones del recuadro para los datos del emisor
  doc.setFontSize(10);
  const emitterX = margin + 5;
  const emitterY = 42; // comienza más abajo para dar espacio al encabezado
  const emitterWidth = 90;
  const emitterHeight = 35;
  doc.rect(emitterX, emitterY, emitterWidth, emitterHeight);

  // Función auxiliar para escribir indicador y dato en línea
  const writeLine = (x, y, label, value) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    // Se escribe el dato justo después del indicador
    doc.text(value, x + labelWidth, y);
  };

  let textX = emitterX + 3;
  let textY = emitterY + 7;
  const lineSpacing = 6; // separación entre líneas

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
  // Ubicar la tabla debajo de los recuadros; se deja espacio suficiente para que no se pisen
  const tableStartY = emitterY + emitterHeight + 15;
  const headers = ["Descripción", "Unidades", "Precio Unitario", "Total"];
  const rows = [];
  document.querySelectorAll("#itemsBody tr").forEach((row) => {
    rows.push([
      row.querySelector(".item-desc").value,
      row.querySelector(".item-units").value,
      "$" +
        parseFloat(row.querySelector(".item-price").value).toLocaleString(
          "es-AR",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        ),
      row.querySelector(".item-total").textContent,
    ]);
  });

  doc.autoTable({
    startY: tableStartY,
    head: [headers],
    body: rows,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0 },
    margin: { left: margin + 5, right: margin + 5 },
  });

  // ----------------------
  // TOTALES Y FORMA DE PAGO
  // ----------------------
  // Se ubica debajo de la tabla con espacio suficiente
  const autoTableFinalY = doc.lastAutoTable.finalY;
  let totalsY = autoTableFinalY + 15;

  // Extraer y calcular totales
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
    // Calcular el ancho del texto en negrita y del valor en normal
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
    // Ubicar a la derecha: x = (pageWidth - margin) - totalTextWidth
    const startX = pageWidth - margin - totalTextWidth - 6;
    doc.setFont("helvetica", "bold");
    doc.text(label, startX, y);
    doc.setFont("helvetica", "normal");
    doc.text(valueText, startX + labelWidth, y);
  };

  writeTotalLine(totalsY, "TOTAL BRUTO: ", totalBruto);
  totalsY += 6;
  writeTotalLine(totalsY, `IVA (${ivaPercent}%): `, iva);
  totalsY += 6;
  writeTotalLine(totalsY, "TOTAL PRESUPUESTO: ", totalPresupuesto);

  // Forma de pago (alineado a la izquierda)
  totalsY += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Forma de Pago: ", margin + 5, totalsY);
  doc.setFont("helvetica", "normal");
  doc.text(
    document.getElementById("formaPago").value,
    margin + 6 + doc.getTextWidth("Forma de Pago: "),
    totalsY
  );

  // ----------------------
  // FIRMA
  // ----------------------
  totalsY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("________________________", 140, totalsY);
  doc.text("Firma y Sello del Proveedor", 140, totalsY + 6);

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
  // Para inputs se usa "input", para selects "change"
  const eventType =
    field.tagName.toLowerCase() === "select" ? "change" : "input";
  field.addEventListener(eventType, () => checkField(field));
});

// Inicialización: agregar eventos a la fila inicial y actualizar totales
addEventListenersToInputs(document.querySelector("#itemsBody tr"));
updateTotals();
