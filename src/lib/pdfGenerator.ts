import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function downloadDocumentPDF(quotation: any, settings: any) {
  try {
    // Preload all unique product images
    const imageMap = new Map<string, HTMLImageElement>();
    const imageUrls: string[] = quotation.items
      .map((item: any) => item.product?.imagenUrl)
      .filter((url: any): url is string => typeof url === "string" && url.length > 0);

    const uniqueUrls = Array.from(new Set(imageUrls));

    await Promise.all(
      uniqueUrls.map(async (url: string) => {
        try {
          const img = await new Promise<HTMLImageElement | null>((resolve) => {
            const tempImg = new Image();
            tempImg.crossOrigin = "anonymous";
            tempImg.onload = () => resolve(tempImg);
            tempImg.onerror = () => resolve(null);
            tempImg.src = url;
          });
          if (img) {
            imageMap.set(url, img);
          }
        } catch (e) {
          console.error("Error preloading image: " + url, e);
        }
      })
    );

    const doc = new jsPDF();
    const isCC = quotation.estado === "CUENTA_COBRO" || quotation.estado === "PAGADA";
    const title = isCC ? "CUENTA DE COBRO" : "COTIZACIÓN";
    const docNumber = isCC ? quotation.numeroCuentaCobro : quotation.numeroCotizacion;

    // 1. Header Section (Dark theme banner)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 35, "F");

    // Company Branding inside Header
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    const companyName = settings?.companyName || "CONSUMIBLES & REPUESTOS";
    const companySlogan = settings?.companySlogan || "Equipos de Corte Plasma y Soldadura Industrial";
    const companyPhone = settings?.companyPhone || "+57 316 831 4501";

    doc.setFontSize(18);
    doc.text(companyName, 15, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(companySlogan, 15, 22);
    doc.text(`Contacto: ${companyPhone}`, 15, 27);

    // Document Type & Number (aligned right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(title, 195, 16, { align: "right" });
    doc.setFontSize(13);
    doc.setTextColor(239, 68, 68); // light red accent
    doc.text(`No. ${docNumber}`, 195, 24, { align: "right" });

    // 2. Information Section
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);

    // Column Left: Client Details
    doc.text("DATOS DEL CLIENTE:", 15, 48);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${quotation.client?.nombre || "N/A"}`, 15, 54);
    if (quotation.client?.nit) {
      doc.text(`NIT / CC: ${quotation.client.nit}`, 15, 60);
    }
    doc.text(`Dirección: ${quotation.client?.direccion || "N/A"}`, 15, 66);
    const locationParts = [quotation.client?.ciudad, quotation.client?.departamento, quotation.client?.pais || "Colombia"].filter(Boolean);
    doc.text(`Ubicación: ${locationParts.join(", ")}`, 15, 72);
    if (quotation.client?.telefono) {
      doc.text(`Teléfono: ${quotation.client.telefono}`, 15, 78);
    }

    // Column Right: Document Details
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DEL DOCUMENTO:", 120, 48);
    doc.setFont("helvetica", "normal");
    
    const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "-";
    doc.text(`Fecha Emisión: ${formatDate(isCC ? quotation.fechaCuentaCobro : quotation.fechaCotizacion)}`, 120, 54);
    
    if (isCC) {
      doc.text(`Fecha Vencimiento: ${formatDate(quotation.fechaVencimiento)}`, 120, 60);
      doc.text("Estado: ACEPTADA / FACTURADA", 120, 66);
    } else {
      doc.text("Estado: PENDIENTE / COTIZACIÓN", 120, 60);
      doc.text("Validez: 15 Días Calendario", 120, 66);
    }

    // Divider Line
    doc.setDrawColor(226, 232, 240); // slate 200
    doc.setLineWidth(0.5);
    doc.line(15, 84, 195, 84);

    // 3. Items Table
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(val);
    };

    const tableRows = quotation.items.map((item: any) => [
      "", // Column 0: Empty for image drawing
      item.product?.codigo || "N/A",
      item.product?.nombre || item.nombre || "N/A",
      item.cantidad,
      formatCurrency(Number(item.precioUnitario)),
      formatCurrency(Number(item.cantidad * item.precioUnitario))
    ]);

    autoTable(doc, {
      startY: 90,
      head: [["Imagen", "Ref / Código", "Descripción", "Cant.", "Valor Unitario", "Valor Total"]],
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 9,
        minCellHeight: 16 // Increase height to fit the product image
      },
      columnStyles: {
        0: { cellWidth: 16, halign: "center" }, // Imagen
        1: { cellWidth: 20 },                  // Ref / Código
        2: { cellWidth: 80 },                  // Descripción
        3: { cellWidth: 12, halign: "center" }, // Cant.
        4: { cellWidth: 26, halign: "right" },  // Valor Unitario
        5: { cellWidth: 26, halign: "right" }   // Valor Total
      },
      styles: {
        valign: "middle",
        overflow: "linebreak"
      },
      margin: { left: 15, right: 15 },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const item = quotation.items[data.row.index];
          const imgUrl = item?.product?.imagenUrl;
          if (imgUrl && imageMap.has(imgUrl)) {
            const imgEl = imageMap.get(imgUrl);
            if (imgEl) {
              const size = 12; // 12x12 mm
              const xOffset = (data.cell.width - size) / 2;
              const yOffset = (data.cell.height - size) / 2;
              doc.addImage(
                imgEl,
                "PNG",
                data.cell.x + xOffset,
                data.cell.y + yOffset,
                size,
                size
              );
            }
          }
        }
      }
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // 4. Totals and Summary Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("RESUMEN DE PAGO:", 120, finalY);
    doc.line(120, finalY + 2, 195, finalY + 2);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Subtotal:", 120, finalY + 8);
    doc.text(formatCurrency(quotation.total), 195, finalY + 8, { align: "right" });
    
    doc.text("Retenciones / Impuestos:", 120, finalY + 13);
    doc.text(formatCurrency(0), 195, finalY + 13, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL NETO A PAGAR:", 120, finalY + 19);
    doc.text(formatCurrency(quotation.total), 195, finalY + 19, { align: "right" });

    // 5. Payment details (Only for CC)
    if (isCC) {
      const paymentY = finalY + 27;
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(226, 232, 240); // Slate 200
      doc.rect(15, paymentY, 180, 28, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("INSTRUCCIONES DE PAGO / CONSIGNACIÓN:", 20, paymentY + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      
      // Split bankDetails string by newline and print
      const lines = (settings.bankDetails || "").split("\n");
      lines.forEach((line: string, i: number) => {
        if (i < 3) { // limit lines to fit box
          doc.text(line, 20, paymentY + 12 + (i * 5));
        }
      });
    }

    // Footer Branding info
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate 400
    doc.text("Este documento digital no constituye factura electrónica bajo el régimen común. Es soporte de cobro equivalente.", 105, pageHeight - 15, { align: "center" });
    doc.text(`Generado de forma automática por ${companyName}.`, 105, pageHeight - 10, { align: "center" });

    // Save the PDF
    const filename = isCC ? `CuentaCobro_${docNumber}.pdf` : `Cotizacion_${docNumber}.pdf`;
    doc.save(filename);
  } catch (err: any) {
    alert("Error al generar PDF: " + err.message);
    console.error("PDF Generation error:", err);
  }
}
