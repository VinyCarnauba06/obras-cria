// ============================================
// PDF - Geração de relatórios profissionais
// ============================================

const pdf = {
  async gerarRelatorio(relatorioId) {
    const relatorio = db.buscarRelatorio(relatorioId);
    if (!relatorio) {
      ui.erro('Relatório não encontrado');
      return;
    }

    const obra = db.buscarObra(relatorio.obraId);
    ui.toast('Gerando PDF...');

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const largura     = doc.internal.pageSize.getWidth();
      const altura      = doc.internal.pageSize.getHeight();
      const margem      = 18;
      const larguraUtil = largura - 2 * margem;

      // ── Paleta ──
      const AZUL_ESCURO  = [12, 18, 52];
      const AZUL_MEDIO   = [25, 38, 88];
      const LARANJA      = [245, 158, 11];   // destaque principal
      const LARANJA_DIM  = [254, 243, 199];  // fundo suave laranja
      const TEXTO_ESCURO = [18, 24, 52];
      const CINZA_MEDIO  = [72, 84, 112];
      const CINZA_LEVE   = [241, 243, 250];
      const BRANCO       = [255, 255, 255];
      const BORDA        = [212, 218, 236];

      // ── Rodapé ──
      const desenharRodape = (pagina) => {
        const ry = altura - 10;
        doc.setDrawColor(...LARANJA);
        doc.setLineWidth(0.4);
        doc.line(margem, altura - 16, largura - margem, altura - 16);

        const dtGer = new Date().toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...CINZA_MEDIO);
        doc.text(`Gerado em ${dtGer}`, margem, ry);
        doc.text(`Página ${pagina}`, largura - margem, ry, { align: 'right' });
        doc.setTextColor(...LARANJA);
        doc.text('Sistema de Supervisão de Creches', largura / 2, ry, { align: 'center' });
      };

      // ════════════════════════════════════════
      // CABEÇALHO
      // ════════════════════════════════════════
      const alturaHeader = 42;

      doc.setFillColor(...AZUL_ESCURO);
      doc.rect(0, 0, largura, alturaHeader, 'F');
      doc.setFillColor(...AZUL_MEDIO);
      doc.rect(0, 0, largura * 0.55, alturaHeader, 'F');

      // Barra de acento topo (laranja)
      doc.setFillColor(...LARANJA);
      doc.rect(0, alturaHeader, largura, 3, 'F');
      doc.rect(0, 0, 5, alturaHeader, 'F');

      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text('RELATÓRIO DE SUPERVISÃO', margem + 8, 17);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(255, 220, 150);
      doc.text('Sistema de Supervisão de Creches', margem + 8, 27);

      const dataFormatada = utils.formatarData(relatorio.dataRelatorio);
      const badgeW = 50, badgeH = 13;
      const badgeX = largura - margem - badgeW;
      doc.setFillColor(...LARANJA);
      doc.roundedRect(badgeX, 14, badgeW, badgeH, 3, 3, 'F');
      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(dataFormatada, badgeX + badgeW / 2, 22, { align: 'center' });

      let y = alturaHeader + 12;

      // ════════════════════════════════════════
      // BLOCO DE INFORMAÇÕES
      // ════════════════════════════════════════
      const alturaInfo = 44;
      doc.setFillColor(...CINZA_LEVE);
      doc.roundedRect(margem, y, larguraUtil, alturaInfo, 3, 3, 'F');
      doc.setDrawColor(...BORDA);
      doc.setLineWidth(0.3);
      doc.roundedRect(margem, y, larguraUtil, alturaInfo, 3, 3, 'S');

      doc.setFillColor(...LARANJA);
      doc.roundedRect(margem, y, 5, alturaInfo, 3, 3, 'F');
      doc.rect(margem + 3, y, 2, alturaInfo, 'F');

      const col1X = margem + 12;
      const col2X = margem + larguraUtil / 2 + 4;
      const sepY  = y + alturaInfo / 2;
      const halfW = larguraUtil / 2 - 16;

      doc.setDrawColor(...BORDA);
      doc.setLineWidth(0.25);
      doc.line(col1X, sepY, margem + larguraUtil - 4, sepY);

      const desenharInfoRow = (lbl, val, rx, ry, maxW) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...CINZA_MEDIO);
        doc.text(lbl, rx, ry);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...TEXTO_ESCURO);
        doc.text(val, rx, ry + 7, maxW ? { maxWidth: maxW } : undefined);
      };

      desenharInfoRow('CRECHE / UNIDADE',  obra?.nome || '—',                             col1X, y + 9,  halfW);
      desenharInfoRow('DATA DO RELATÓRIO', dataFormatada,                                 col2X, y + 9,  halfW);
      desenharInfoRow('SUPERVISOR',        relatorio.supervisor || 'Maurício Carnaúba',   col1X, y + 27, halfW);
      desenharInfoRow('ENDEREÇO',          relatorio.endereco || obra?.endereco || '—',   col2X, y + 27, halfW);

      y += alturaInfo + 14;

      // ════════════════════════════════════════
      // OBSERVAÇÃO GERAL
      // ════════════════════════════════════════
      if (relatorio.observacaoGeral) {
        this._desenharSecaoTitulo(doc, 'OBSERVAÇÃO GERAL', margem, y, larguraUtil, LARANJA);
        y += 14;

        const obsLinhas = doc.splitTextToSize(relatorio.observacaoGeral, larguraUtil - 12);
        const alturaObs = obsLinhas.length * 5.5 + 16;

        doc.setFillColor(255, 251, 235);
        doc.roundedRect(margem, y, larguraUtil, alturaObs, 2, 2, 'F');
        doc.setDrawColor(...BORDA);
        doc.setLineWidth(0.25);
        doc.roundedRect(margem, y, larguraUtil, alturaObs, 2, 2, 'S');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...TEXTO_ESCURO);
        doc.text(obsLinhas, margem + 8, y + 10);

        y += alturaObs + 16;
      }

      // ════════════════════════════════════════
      // TAREFAS SELECIONADAS
      // ════════════════════════════════════════
      const tarefas = relatorio.tarefasSelecionadas || [];
      if (tarefas.length > 0) {
        if (y > altura - 80) {
          desenharRodape(doc.internal.getNumberOfPages());
          doc.addPage();
          y = margem;
        }

        this._desenharSecaoTitulo(
          doc,
          `TAREFAS DO RELATÓRIO — ${tarefas.length} tarefa${tarefas.length !== 1 ? 's' : ''}`,
          margem, y, larguraUtil, LARANJA
        );
        y += 14;

        const STATUS_CORES = {
          'nao-iniciada': { bg: [240, 242, 248], tx: [100, 116, 160] },
          'em-andamento': { bg: [254, 252, 232], tx: [133, 100, 10] },
          'concluida':    { bg: [220, 252, 231], tx: [22, 101, 52]  },
          'em-atraso':    { bg: [254, 226, 226], tx: [153, 27, 27]  }
        };

        const STATUS_TEXTO = {
          'nao-iniciada': 'Não Iniciada',
          'em-andamento': 'Em Andamento',
          'concluida':    'Concluída',
          'em-atraso':    'Em Atraso'
        };

        const colW     = (larguraUtil - 6) / 2;
        const itemH    = 10;
        const itemGap  = 4;

        for (let i = 0; i < tarefas.length; i += 2) {
          if (y + itemH + itemGap > altura - 22) {
            desenharRodape(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margem;
          }

          const par = [tarefas[i], tarefas[i + 1]].filter(Boolean);
          for (let j = 0; j < par.length; j++) {
            const t   = par[j];
            const tx  = margem + j * (colW + 6);
            const cor = STATUS_CORES[t.status] || STATUS_CORES['nao-iniciada'];

            doc.setFillColor(...cor.bg);
            doc.roundedRect(tx, y, colW, itemH, 1.5, 1.5, 'F');
            doc.setDrawColor(...BORDA);
            doc.setLineWidth(0.2);
            doc.roundedRect(tx, y, colW, itemH, 1.5, 1.5, 'S');

            // Indicador de cor lateral
            doc.setFillColor(...cor.tx);
            doc.roundedRect(tx, y, 3, itemH, 1.5, 1.5, 'F');
            doc.rect(tx + 1.5, y, 1.5, itemH, 'F');

            // Texto da tarefa
            const descCortada = doc.splitTextToSize(t.descricao, colW - 42);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...TEXTO_ESCURO);
            doc.text(descCortada[0] || '', tx + 6, y + 6.5);

            // Badge de status
            const badgeTx   = STATUS_TEXTO[t.status] || t.status;
            const badgeTxW  = doc.getTextWidth(badgeTx) + 6;
            const badgeTxX  = tx + colW - badgeTxW - 2;
            doc.setFillColor(...cor.tx);
            doc.roundedRect(badgeTxX, y + 2, badgeTxW, 6, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...BRANCO);
            doc.text(badgeTx, badgeTxX + badgeTxW / 2, y + 6, { align: 'center' });
          }

          y += itemH + itemGap;
        }

        y += 8;
      }

      // ════════════════════════════════════════
      // REGISTRO FOTOGRÁFICO
      // ════════════════════════════════════════
      const fotos = relatorio.fotos || [];
      if (fotos.length > 0) {
        if (y > altura - 90) {
          desenharRodape(doc.internal.getNumberOfPages());
          doc.addPage();
          y = margem;
        }

        this._desenharSecaoTitulo(
          doc,
          `REGISTRO FOTOGRÁFICO — ${fotos.length} foto${fotos.length !== 1 ? 's' : ''}`,
          margem, y, larguraUtil, LARANJA
        );
        y += 16;

        const gap       = 6;
        const fotoW     = (larguraUtil - gap) / 2;
        const fotoH     = fotoW * 0.72;
        const CAPTION_H = 18;

        const dataWm = utils.formatarData(relatorio.dataRelatorio);

        for (let i = 0; i < fotos.length; i += 2) {
          const par = [fotos[i], fotos[i + 1]].filter(Boolean);

          // Header do bloco de fotos
          const labelBloco = par[0]?.observacao
            ? doc.splitTextToSize(par[0].observacao, larguraUtil - 4)[0]
            : `Etapa ${Math.floor(i / 2) + 1}`;

          const HEADER_H = 14;
          if (y + HEADER_H + fotoH + CAPTION_H + gap > altura - 22) {
            desenharRodape(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margem;
          }

          // Cabeçalho individual do bloco
          doc.setFillColor(250, 248, 240);
          doc.roundedRect(margem, y, larguraUtil, HEADER_H, 2, 2, 'F');
          doc.setDrawColor(...LARANJA);
          doc.setLineWidth(0.3);
          doc.roundedRect(margem, y, larguraUtil, HEADER_H, 2, 2, 'S');
          doc.setFillColor(...LARANJA);
          doc.rect(margem, y, 4, HEADER_H, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...TEXTO_ESCURO);
          doc.text(labelBloco, margem + 9, y + 5.5);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...CINZA_MEDIO);
          doc.text('Fotos', margem + 9, y + 10.5);

          y += HEADER_H + 4;

          // Calcula altura da caption
          let maxCaption = CAPTION_H;
          for (const f of par) {
            if (f.observacao) {
              const linhas = doc.splitTextToSize(f.observacao, fotoW - 8);
              const ch = linhas.length * 4.5 + 8;
              if (ch > maxCaption) maxCaption = ch;
            }
          }
          const alturaBloco = fotoH + maxCaption + gap;

          if (y + alturaBloco > altura - 22) {
            desenharRodape(doc.internal.getNumberOfPages());
            doc.addPage();
            y = margem;
          }

          for (let j = 0; j < par.length; j++) {
            const foto = par[j];
            const x    = margem + j * (fotoW + gap);

            // Sombra
            doc.setFillColor(180, 190, 215);
            doc.roundedRect(x + 1.5, y + 1.5, fotoW, fotoH, 2, 2, 'F');

            // Fundo branco
            doc.setFillColor(...BRANCO);
            doc.roundedRect(x, y, fotoW, fotoH, 2, 2, 'F');

            // Imagem
            try {
              const dataURL = await this.imagemParaDataURL(foto.url);
              doc.addImage(dataURL, 'JPEG', x + 1, y + 1, fotoW - 2, fotoH - 2);
            } catch {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(...CINZA_MEDIO);
              doc.text('[foto indisponível]', x + fotoW / 2, y + fotoH / 2, { align: 'center' });
            }

            // Watermark data/hora (canto inferior direito da foto)
            doc.setFillColor(0, 0, 0);
            const wmH = 6, wmW = 28;
            doc.setGState && doc.setGState(new doc.GState({ opacity: 0.55 }));
            doc.rect(x + fotoW - wmW - 1, y + fotoH - wmH - 1, wmW, wmH, 'F');
            doc.setGState && doc.setGState(new doc.GState({ opacity: 1 }));
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.setTextColor(...BRANCO);
            doc.text(dataWm, x + fotoW - wmW / 2 - 1, y + fotoH - 3, { align: 'center' });

            // Borda da foto
            doc.setDrawColor(...BORDA);
            doc.setLineWidth(0.4);
            doc.roundedRect(x, y, fotoW, fotoH, 2, 2, 'S');

            // Caption / Obs
            const captionY = y + fotoH + 3;
            if (foto.observacao) {
              const obsLn = doc.splitTextToSize(foto.observacao, fotoW - 16);
              const ch    = obsLn.length * 4.5 + 10;
              doc.setFillColor(255, 251, 235);
              doc.roundedRect(x, captionY, fotoW, ch, 1.5, 1.5, 'F');
              doc.setDrawColor(...BORDA);
              doc.setLineWidth(0.2);
              doc.roundedRect(x, captionY, fotoW, ch, 1.5, 1.5, 'S');
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6.5);
              doc.setTextColor(...LARANJA);
              doc.text('Obs:', x + 4, captionY + 5.5);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7.5);
              doc.setTextColor(...TEXTO_ESCURO);
              doc.text(obsLn, x + 4, captionY + 11);
            } else {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.setTextColor(185, 195, 220);
              doc.text(`Foto ${i + j + 1}`, x + 3.5, captionY + 5);
            }
          }

          y += alturaBloco + 10;
        }
      }

      desenharRodape(doc.internal.getNumberOfPages());

      const nomeArquivo = `relatorio_${obra?.nome?.replace(/\s+/g, '_') || 'obra'}_${utils.formatarDataInput(relatorio.dataRelatorio)}.pdf`;
      doc.save(nomeArquivo);

      ui.sucesso('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro PDF:', err);
      ui.erro('Erro ao gerar PDF: ' + err.message);
    }
  },

  _desenharSecaoTitulo(doc, texto, x, y, larguraUtil, cor) {
    doc.setFillColor(...cor);
    doc.rect(x, y, 3.5, 11, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...cor);
    doc.text(texto, x + 8, y + 8);

    const txtW = doc.getTextWidth(texto);
    doc.setDrawColor(...cor);
    doc.setLineWidth(0.4);
    doc.line(x + 8 + txtW + 4, y + 5.5, x + larguraUtil, y + 5.5);
  },

  imagemParaDataURL(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (err) { reject(err); }
      };
      img.onerror = reject;
      img.src = url;
    });
  }
};
