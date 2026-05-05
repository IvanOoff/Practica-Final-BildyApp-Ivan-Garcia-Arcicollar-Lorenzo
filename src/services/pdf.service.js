import PDFDocument from 'pdfkit';

export const generateDeliveryNotePdf = async (deliveryNote) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).text('ALBARAN', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Numero: ${deliveryNote.sequentialNumber || 'N/A'}`);
      doc.text(`Fecha: ${new Date(deliveryNote.date).toLocaleDateString()}`);
      doc.text(`Estado: ${deliveryNote.status === 'signed' ? 'FIRMADO' : 'PENDIENTE'}`);
      doc.moveDown();

      doc.fontSize(14).text('DATOS DEL CLIENTE', { underline: true });
      doc.fontSize(11);
      doc.text(`Nombre: ${deliveryNote.client?.name || 'N/A'}`);
      doc.text(`CIF: ${deliveryNote.client?.cif || 'N/A'}`);
      doc.text(`Email: ${deliveryNote.client?.email || 'N/A'}`);
      doc.moveDown();

      doc.fontSize(14).text('DATOS DEL PROYECTO', { underline: true });
      doc.fontSize(11);
      doc.text(`Nombre: ${deliveryNote.project?.name || 'N/A'}`);
      doc.text(`Codigo: ${deliveryNote.project?.projectCode || 'N/A'}`);
      if (deliveryNote.project?.address) {
        const addr = deliveryNote.project.address;
        doc.text(`Direccion: ${addr.street || ''}, ${addr.number || ''}, ${addr.city || ''}, ${addr.province || ''}`);
      }
      doc.moveDown();

      doc.fontSize(14).text('DETALLE DEL TRABAJO', { underline: true });
      doc.fontSize(11);
      doc.text(`Tipo: ${deliveryNote.type === 'hours' ? 'HORAS' : deliveryNote.type === 'materials' ? 'MATERIALES' : 'MIXTO'}`);
      doc.text(`Descripcion: ${deliveryNote.description || 'Sin descripcion'}`);

      if (deliveryNote.items && deliveryNote.items.length > 0) {
        doc.moveDown(0.5);
        doc.text('Items:');
        let subtotal = 0;
        deliveryNote.items.forEach((item, index) => {
          const itemTotal = item.quantity * item.price;
          subtotal += itemTotal;
          doc.text(`  ${index + 1}. ${item.description} - ${item.quantity} ${item.unit} x ${item.price}€ = ${itemTotal}€`);
        });
        doc.moveDown(0.5);
        const taxAmount = subtotal * (deliveryNote.taxRate / 100);
        const total = subtotal + taxAmount;
        doc.text(`Subtotal: ${subtotal.toFixed(2)}€`);
        doc.text(`Impuestos (${deliveryNote.taxRate}%): ${taxAmount.toFixed(2)}€`);
        doc.text(`Total: ${total.toFixed(2)}€`);
      }

      if (deliveryNote.status === 'signed' && deliveryNote.signatureUrl) {
        doc.moveDown();
        doc.fontSize(14).text('FIRMA', { underline: true });
        doc.fontSize(10).text('Documento firmado por el cliente');
        doc.text(`Firmado por: ${deliveryNote.signedBy || 'N/A'}`);
        doc.text(`Fecha firma: ${deliveryNote.signedAt ? new Date(deliveryNote.signedAt).toLocaleString() : 'N/A'}`);
      }

      doc.moveDown(2);
      doc.fontSize(8).text(`Generado el: ${new Date().toISOString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default { generateDeliveryNotePdf };
