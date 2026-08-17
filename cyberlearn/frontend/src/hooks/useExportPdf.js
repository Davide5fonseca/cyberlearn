import { useCallback } from 'react';

// Exportação de tabelas para PDF com carregamento diferido do jspdf:
// as bibliotecas (~350 KB) só são descarregadas quando o utilizador
// clica em exportar, em vez de entrarem no bundle inicial.
//
// Variantes:
//  - 'simples'   → título + subtítulo + tabela em grelha (AdminDashboard);
//  - 'relatorio' → cabeçalho com a marca, linha separadora, tabela às
//                  riscas, bloco de assinatura e rodapé com numeração de
//                  páginas (ProfessorDashboard).
export function useExportPdf() {
  const exportarPdf = useCallback(async ({ titulo, subtitulo, colunas, linhas, nomeFicheiro, variante = 'simples', assinatura }) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const corPrimaria = [59, 130, 246];

    if (variante === 'relatorio') {
      const corTexto = [51, 51, 51];

      doc.setFontSize(22);
      doc.setTextColor(corPrimaria[0], corPrimaria[1], corPrimaria[2]);
      doc.text('CyberLearn', 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
      doc.text(titulo, 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 14, 38);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 42, 196, 42);

      autoTable(doc, {
        startY: 50,
        head: [colunas],
        body: linhas,
        theme: 'striped',
        headStyles: { fillColor: corPrimaria, textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { cellPadding: 6, fontSize: 10, font: 'helvetica' },
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 50;

      if (assinatura) {
        doc.setFontSize(12);
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        doc.text(assinatura, 14, finalY + 30);

        doc.setDrawColor(0, 0, 0);
        doc.line(14, finalY + 50, 80, finalY + 50);
      }

      const totalPaginas = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPaginas} - Gerado por CyberLearn LMS`, 14, 290);
      }
    } else {
      doc.setFontSize(18);
      doc.text(titulo, 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(subtitulo, 14, 30);

      autoTable(doc, {
        startY: 36,
        head: [colunas],
        body: linhas,
        theme: 'grid',
        headStyles: { fillColor: corPrimaria },
        styles: { fontSize: 10 },
      });
    }

    doc.save(nomeFicheiro);
  }, []);

  return exportarPdf;
}
