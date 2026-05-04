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
      doc.text(`Fecha: ${new Date(deliveryNote.workDate).toLocaleDateString()}`);
      doc.text(`Estado: ${deliveryNote.signed ? 'FIRMADO' : 'PENDIENTE'}`);
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
      doc.text(`Tipo: ${deliveryNote.format === 'hours' ? 'HORAS' : 'MATERIALES'}`);
      doc.text(`Descripcion: ${deliveryNote.description || 'Sin descripcion'}`);

      if (deliveryNote.format === 'hours') {
        doc.moveDown(0.5);
        doc.text('Horas trabajadas:');
        if (deliveryNote.hours) {
          doc.text(`  - ${deliveryNote.hours} horas`);
        }
        if (deliveryNote.workers && deliveryNote.workers.length > 0) {
          deliveryNote.workers.forEach((w) => {
            doc.text(`  - ${w.name}: ${w.hours} horas`);
          });
        }
      } else {
        doc.moveDown(0.5);
        doc.text('Materiales entregados:');
        doc.text(`  - ${deliveryNote.material || 'N/A'}`);
        doc.text(`  - Cantidad: ${deliveryNote.quantity || 0} ${deliveryNote.unit || 'ud'}`);
      }

      if (deliveryNote.signed && deliveryNote.signatureUrl) {
        doc.moveDown();
        doc.fontSize(14).text('FIRMA', { underline: true });
        doc.fontSize(10).text('Documento firmado por el cliente');
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
