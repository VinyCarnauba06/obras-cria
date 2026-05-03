// ============================================
// PDF - Geração de relatórios por tarefa
// ============================================

const pdf = {
  async gerarRelatorio(relatorioId) {
    const relatorio = db.buscarRelatorio(relatorioId);
    if (!relatorio) { ui.erro('Relatório não encontrado'); return; }

    const obra = db.buscarObra(relatorio.obraId);
    ui.toast('Gerando PDF...');

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const largura     = doc.internal.pageSize.getWidth();
      const altura      = doc.internal.pageSize.getHeight();
      const margem      = 18;
      const larguraUtil = largura - 2 * margem;

      // ── Paleta: preto / azul / branco ──
      const AZUL_ESCURO  = [12, 18, 52];
      const AZUL_MEDIO   = [25, 38, 88];
      const AZUL         = [79, 70, 229];
      const AZUL_DIM     = [235, 234, 250];
      const TEXTO_ESCURO = [18, 24, 52];
      const CINZA_MEDIO  = [72, 84, 112];
      const CINZA_LEVE   = [241, 243, 250];
      const BRANCO       = [255, 255, 255];
      const BORDA        = [212, 218, 236];

      let paginaAtual = 1;

      const desenharRodape = () => {
        const ry = altura - 10;
        doc.setDrawColor(...AZUL);
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
        doc.text(`Página ${paginaAtual}`, largura - margem, ry, { align: 'right' });
        doc.setTextColor(...AZUL);
        doc.text('Sistema de Supervisão de Creches', largura / 2, ry, { align: 'center' });
      };

      const novaPage = () => {
        desenharRodape();
        doc.addPage();
        paginaAtual++;
        return margem;
      };

      const checarEspaco = (y, minH) => {
        if (y + minH > altura - 22) return novaPage();
        return y;
      };

      // ════════════════════════════════════════
      // CABEÇALHO
      // ════════════════════════════════════════
      const alturaHeader = 42;
      doc.setFillColor(...AZUL_ESCURO);
      doc.rect(0, 0, largura, alturaHeader, 'F');
      doc.setFillColor(...AZUL_MEDIO);
      doc.rect(0, 0, largura * 0.55, alturaHeader, 'F');
      doc.setFillColor(...AZUL);
      doc.rect(0, alturaHeader, largura, 3, 'F');
      doc.rect(0, 0, 5, alturaHeader, 'F');

      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(19);
      doc.text('RELATÓRIO DE SUPERVISÃO', margem + 8, 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(180, 190, 255);
      doc.text('Sistema de Supervisão de Creches', margem + 8, 27);

      const dataFormatada = utils.formatarData(relatorio.dataRelatorio);
      const bW = 50, bH = 13, bX = largura - margem - bW;
      doc.setFillColor(...AZUL);
      doc.roundedRect(bX, 14, bW, bH, 3, 3, 'F');
      doc.setTextColor(...BRANCO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(dataFormatada, bX + bW / 2, 22, { align: 'center' });

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
      doc.setFillColor(...AZUL);
      doc.roundedRect(margem, y, 5, alturaInfo, 3, 3, 'F');
      doc.rect(margem + 3, y, 2, alturaInfo, 'F');

      const c1X  = margem + 12;
      const c2X  = margem + larguraUtil / 2 + 4;
      const hlfW = larguraUtil / 2 - 16;

      doc.setDrawColor(...BORDA);
      doc.setLineWidth(0.25);
      doc.line(c1X, y + alturaInfo / 2, margem + larguraUtil - 4, y + alturaInfo / 2);

      const infoRow = (lbl, val, rx, ry) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...CINZA_MEDIO);
        doc.text(lbl, rx, ry);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...TEXTO_ESCURO);
        doc.text(String(val || '—'), rx, ry + 7, { maxWidth: hlfW });
      };

      infoRow('CRECHE / UNIDADE',  obra?.nome || '—',                           c1X, y + 9);
      infoRow('DATA DO RELATÓRIO', dataFormatada,                                c2X, y + 9);
      infoRow('SUPERVISOR',        relatorio.supervisor || 'Maurício Carnaúba',  c1X, y + 27);
      infoRow('ENDEREÇO',          relatorio.endereco || obra?.endereco || '—',  c2X, y + 27);

      y += alturaInfo + 16;

      // ════════════════════════════════════════
      // SEÇÕES POR TAREFA
      // ════════════════════════════════════════
      const tarefas = relatorio.tarefasSelecionadas || [];
      const todasFotos = relatorio.fotos || [];

      const STATUS_TEXTO = {
        'nao-iniciada': 'Não Iniciada',
        'em-andamento': 'Em Andamento',
        'concluida':    'Concluída',
        'em-atraso':    'Em Atraso'
      };

      for (let ti = 0; ti < tarefas.length; ti++) {
        const tarefa = tarefas[ti];
        const tarefaIdReal = tarefa._id || tarefa.id;
        const fotosDaTarefa = todasFotos.filter(f => f.tarefaId === tarefaIdReal);

        // ── Cabeçalho da tarefa ──
        const nomeLinhas = doc.splitTextToSize(tarefa.descricao || '', larguraUtil - 65);
        const altNome    = nomeLinhas.length * 5.8;
        const TASK_H     = Math.max(26, altNome + 16);

        y = checarEspaco(y, TASK_H + 10);

        doc.setFillColor(20, 30, 70);
        doc.roundedRect(margem, y, larguraUtil, TASK_H, 3, 3, 'F');
        doc.setFillColor(...AZUL);
        doc.roundedRect(margem, y, 5, TASK_H, 3, 3, 'F');
        doc.rect(margem + 3, y, 2, TASK_H, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(130, 150, 255);
        doc.text(`TAREFA ${ti + 1} DE ${tarefas.length}`, margem + 10, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...BRANCO);
        doc.text(nomeLinhas, margem + 10, y + 15, { lineHeightFactor: 1.4 });

        // Badge de status
        const badgeTx  = STATUS_TEXTO[tarefa.status] || tarefa.status || '—';
        const badgeTxW = doc.getTextWidth(badgeTx) + 10;
        const badgeTxX = margem + larguraUtil - badgeTxW - 6;
        doc.setFillColor(...AZUL);
        doc.roundedRect(badgeTxX, y + 6, badgeTxW, 9, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...BRANCO);
        doc.text(badgeTx, badgeTxX + badgeTxW / 2, y + 12, { align: 'center' });

        y += TASK_H + 8;

        // ── Observação da tarefa ──
        if (tarefa.observacao) {
          const obsLns = doc.splitTextToSize(tarefa.observacao, larguraUtil - 20);
          const altObs = obsLns.length * 5.5 + 18;
          y = checarEspaco(y, altObs);

          doc.setFillColor(...AZUL_DIM);
          doc.roundedRect(margem, y, larguraUtil, altObs, 2, 2, 'F');
          doc.setDrawColor(...BORDA);
          doc.setLineWidth(0.25);
          doc.roundedRect(margem, y, larguraUtil, altObs, 2, 2, 'S');
          doc.setFillColor(...AZUL);
          doc.rect(margem, y, 3.5, altObs, 'F');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...AZUL);
          doc.text('OBSERVAÇÃO DA TAREFA', margem + 8, y + 7);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(...TEXTO_ESCURO);
          doc.text(obsLns, margem + 8, y + 13.5);

          y += altObs + 10;
        }

        // ── Fotos da tarefa ──
        if (fotosDaTarefa.length > 0) {
          y = checarEspaco(y, 20);
          this._desenharSecaoTitulo(
            doc,
            `REGISTRO FOTOGRÁFICO — ${fotosDaTarefa.length} foto${fotosDaTarefa.length !== 1 ? 's' : ''}`,
            margem, y, larguraUtil, AZUL
          );
          y += 16;
          y = await this._renderizarFotos(
            doc, fotosDaTarefa, y, margem, larguraUtil, altura,
            dataFormatada, AZUL, AZUL_DIM, BORDA, CINZA_MEDIO, BRANCO, TEXTO_ESCURO,
            novaPage, checarEspaco
          );
          y += 10;
        }

        // Separador entre tarefas
        if (ti < tarefas.length - 1) {
          y = checarEspaco(y, 6);
          doc.setDrawColor(...BORDA);
          doc.setLineWidth(0.3);
          doc.line(margem, y, margem + larguraUtil, y);
          y += 12;
        }
      }

      // ════════════════════════════════════════
      // OBSERVAÇÕES GERAIS (texto + fotos avulsas)
      // ════════════════════════════════════════
      const fotosGerais  = todasFotos.filter(f => !f.tarefaId);
      const temObsGeral  = !!relatorio.observacaoGeral;
      const temFotosGer  = fotosGerais.length > 0;

      if (temObsGeral || temFotosGer) {
        y = checarEspaco(y, 30);

        this._desenharSecaoTitulo(doc, 'OBSERVAÇÕES GERAIS', margem, y, larguraUtil, AZUL);
        y += 14;

        if (temObsGeral) {
          const obsLns = doc.splitTextToSize(relatorio.observacaoGeral, larguraUtil - 12);
          const altObs = obsLns.length * 5.5 + 16;
          y = checarEspaco(y, altObs);

          doc.setFillColor(...AZUL_DIM);
          doc.roundedRect(margem, y, larguraUtil, altObs, 2, 2, 'F');
          doc.setDrawColor(...BORDA);
          doc.setLineWidth(0.25);
          doc.roundedRect(margem, y, larguraUtil, altObs, 2, 2, 'S');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
          doc.setTextColor(...TEXTO_ESCURO);
          doc.text(obsLns, margem + 8, y + 10);

          y += altObs + 12;
        }

        if (temFotosGer) {
          y = checarEspaco(y, 20);
          this._desenharSecaoTitulo(
            doc,
            `REGISTROS GERAIS — ${fotosGerais.length} foto${fotosGerais.length !== 1 ? 's' : ''}`,
            margem, y, larguraUtil, AZUL
          );
          y += 16;
          y = await this._renderizarFotos(
            doc, fotosGerais, y, margem, larguraUtil, altura,
            dataFormatada, AZUL, AZUL_DIM, BORDA, CINZA_MEDIO, BRANCO, TEXTO_ESCURO,
            novaPage, checarEspaco
          );
        }
      }

      desenharRodape();

      const nomeArquivo = `relatorio_${obra?.nome?.replace(/\s+/g, '_') || 'obra'}_${utils.formatarDataInput(relatorio.dataRelatorio)}.pdf`;
      doc.save(nomeArquivo);
      ui.sucesso('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro PDF:', err);
      ui.erro('Erro ao gerar PDF: ' + err.message);
    }
  },

  async _renderizarFotos(
    doc, fotos, y, margem, larguraUtil, altura,
    dataWm, AZUL, AZUL_DIM, BORDA, CINZA_MEDIO, BRANCO, TEXTO_ESCURO,
    novaPage, checarEspaco
  ) {
    const gap       = 6;
    const fotoW     = (larguraUtil - gap) / 2;
    const fotoH     = fotoW * 0.72;
    const CAPTION_H = 18;

    for (let i = 0; i < fotos.length; i += 2) {
      const par = [fotos[i], fotos[i + 1]].filter(Boolean);

      // Calcular altura máxima da caption
      let maxCaption = CAPTION_H;
      for (const f of par) {
        if (f.observacao) {
          const lns = doc.splitTextToSize(f.observacao, fotoW - 8);
          const ch = lns.length * 4.5 + 8;
          if (ch > maxCaption) maxCaption = ch;
        }
      }
      const alturaBloco = fotoH + maxCaption + gap;

      y = checarEspaco(y, alturaBloco);

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

        // Watermark data
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

        // Caption / Observação individual
        const captionY = y + fotoH + 3;
        if (foto.observacao) {
          const obsLn = doc.splitTextToSize(foto.observacao, fotoW - 16);
          const ch    = obsLn.length * 4.5 + 10;
          doc.setFillColor(...AZUL_DIM);
          doc.roundedRect(x, captionY, fotoW, ch, 1.5, 1.5, 'F');
          doc.setDrawColor(...BORDA);
          doc.setLineWidth(0.2);
          doc.roundedRect(x, captionY, fotoW, ch, 1.5, 1.5, 'S');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...AZUL);
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

      y += alturaBloco + 8;
    }

    return y;
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
