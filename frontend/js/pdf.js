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

      const largura  = doc.internal.pageSize.getWidth();
      const altura   = doc.internal.pageSize.getHeight();
      const margem   = 18;
      const larguraUtil = largura - 2 * margem;

      // ── Paleta ──
      const AZUL_ESCURO   = [12, 18, 52];
      const AZUL_MEDIO    = [25, 38, 88];
      const INDIGO        = [108, 99, 240];
      const INDIGO_CLARO  = [167, 139, 250];
      const TEXTO_ESCURO  = [18, 24, 52];
      const CINZA_MEDIO   = [72, 84, 112];
      const CINZA_LEVE    = [241, 243, 250];
      const BRANCO        = [255, 255, 255];
      const BORDA         = [212, 218, 236];

      // ── Rodapé (reutilizável) ──
      const desenharRodape = (pagina) => {
        const ry = altura - 10;
        doc.setDrawColor(...INDIGO);
        doc.setLineWidth(0.4);
        doc.line(margem, altura - 16, largura - margem, altura - 16);

        const agora = new Date();
        const dtGer = agora.toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...CINZA_MEDIO);
        doc.text(`Gerado em ${dtGer}`, margem, ry);
        doc.text(`Página ${pagina}`, largura - margem, ry, { align: 'right' });
        doc.setTextColor(...INDIGO);
        doc.text('Sistema de Supervisão de Creches', largura / 2, ry, { align: 'center' });
      };

      // ════════════════════════════════════════
      // CABEÇALHO
      // ════════════════════════════════════════
      const alturaHeader = 42;

      // Fundo base escuro
      doc.setFillColor(...AZUL_ESCURO);
      doc.rect(0, 0, largura, alturaHeader, 'F');

      // Sobreposição diagonal (simula gradiente)
      doc.setFillColor(...AZUL_MEDIO);
      doc.rect(0, 0, largura * 0.55, alturaHeader, 'F');

      // Barra de acento topo
      doc.setFillColor(...INDIGO);
      doc.rect(0, alturaHeader, largura, 3, 'F');

      // Barra lateral esquerda decorativa
      doc.setFillColor(...INDIGO_CLARO);
      doc.rect(0, 0, 5, alturaHeader, 'F');

      // Título principal
      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text('RELATÓRIO DE SUPERVISÃO', margem + 8, 17);

      // Subtítulo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(195, 208, 255);
      doc.text('Sistema de Supervisão de Creches', margem + 8, 27);

      // Badge data (canto direito)
      const dataFormatada = utils.formatarData(relatorio.dataRelatorio);
      const badgeW = 50;
      const badgeH = 13;
      const badgeX = largura - margem - badgeW;
      doc.setFillColor(...INDIGO);
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

      // Barra indigo esquerda
      doc.setFillColor(...INDIGO);
      doc.roundedRect(margem, y, 5, alturaInfo, 3, 3, 'F');
      doc.rect(margem + 3, y, 2, alturaInfo, 'F');

      const col1X  = margem + 12;
      const col2X  = margem + larguraUtil / 2 + 4;
      const sepY   = y + alturaInfo / 2;

      // Linha divisória interna horizontal
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

      const halfW = larguraUtil / 2 - 16;

      desenharInfoRow('CRECHE / UNIDADE', obra?.nome || '—', col1X, y + 9,  halfW);
      desenharInfoRow('DATA DO RELATÓRIO', dataFormatada,     col2X, y + 9,  halfW);
      desenharInfoRow('SUPERVISOR',        relatorio.supervisor || 'Maurício Carnaúba', col1X, y + 27, halfW);
      desenharInfoRow('ENDEREÇO',          relatorio.endereco || obra?.endereco || '—', col2X, y + 27, halfW);

      y += alturaInfo + 14;

      // ════════════════════════════════════════
      // OBSERVAÇÃO GERAL
      // ════════════════════════════════════════
      if (relatorio.observacaoGeral) {
        this._desenharSecaoTitulo(doc, 'OBSERVAÇÃO GERAL', margem, y, larguraUtil, INDIGO);
        y += 14;

        const obsLinhas  = doc.splitTextToSize(relatorio.observacaoGeral, larguraUtil - 12);
        const alturaObs  = obsLinhas.length * 5.5 + 16;

        doc.setFillColor(248, 249, 253);
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
      // FOTOS
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
          margem, y, larguraUtil, INDIGO
        );
        y += 16;

        const gap       = 6;
        const fotoW     = (larguraUtil - gap) / 2;
        const fotoH     = fotoW * 0.72;
        const CAPTION_H = 14;

        for (let i = 0; i < fotos.length; i += 2) {
          const par = [fotos[i], fotos[i + 1]].filter(Boolean);

          // Calcular altura máxima do par
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

            // Sombra simulada
            doc.setFillColor(180, 190, 215);
            doc.roundedRect(x + 1.5, y + 1.5, fotoW, fotoH, 2, 2, 'F');

            // Fundo branco da foto
            doc.setFillColor(...BRANCO);
            doc.roundedRect(x, y, fotoW, fotoH, 2, 2, 'F');

            // Imagem
            try {
              const dataURL = await this.imagemParaDataURL(foto.url);
              doc.addImage(dataURL, 'JPEG', x + 1, y + 1, fotoW - 2, fotoH - 2);
            } catch (err) {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(8);
              doc.setTextColor(...CINZA_MEDIO);
              doc.text('[foto indisponível]', x + fotoW / 2, y + fotoH / 2, { align: 'center' });
            }

            // Borda da foto
            doc.setDrawColor(...BORDA);
            doc.setLineWidth(0.4);
            doc.roundedRect(x, y, fotoW, fotoH, 2, 2, 'S');

            // Caption
            const captionY = y + fotoH + 3;
            if (foto.observacao) {
              const obsLn = doc.splitTextToSize(foto.observacao, fotoW - 8);
              const ch    = obsLn.length * 4.5 + 8;
              doc.setFillColor(242, 244, 252);
              doc.roundedRect(x, captionY, fotoW, ch, 1.5, 1.5, 'F');
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7.5);
              doc.setTextColor(...CINZA_MEDIO);
              doc.text(obsLn, x + 4, captionY + 5.5);
            } else {
              doc.setFont('helvetica', 'italic');
              doc.setFontSize(7);
              doc.setTextColor(185, 195, 220);
              doc.text(`Foto ${i + j + 1}`, x + 3.5, captionY + 5);
            }
          }

          y += alturaBloco;
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
    // Barra vertical colorida
    doc.setFillColor(...cor);
    doc.rect(x, y, 3.5, 11, 'F');

    // Texto do título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...cor);
    doc.text(texto, x + 8, y + 8);

    // Linha decorativa
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
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }
};
