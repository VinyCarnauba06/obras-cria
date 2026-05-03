// frontend/js/pdf-parser.js

const pdfParser = {
  _lib: null,

  async _carregarLib() {
    if (this._lib) return this._lib;
    if (window.pdfjsLib) {
      this._lib = window.pdfjsLib;
      return this._lib;
    }
    const mod = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.min.mjs');
    mod.GlobalWorkerOptions.workerSrc =
      'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs';
    window.pdfjsLib = mod;
    this._lib = mod;
    return this._lib;
  },

  // Agrupa itens de texto por proximidade de coordenada Y (mesma linha visual)
  _reconstruirLinhas(items) {
    if (!items.length) return [];

    const Y_TOLERANCIA = 3; // itens dentro de 3pt são tratados como mesma linha
    const grupos = [];

    for (const item of items) {
      if (!item.str.trim()) continue;
      const y = item.transform[5];
      const grupo = grupos.find(g => Math.abs(g.y - y) <= Y_TOLERANCIA);
      if (grupo) {
        grupo.items.push(item);
      } else {
        grupos.push({ y, items: [item] });
      }
    }

    // Y descrescente = topo→rodapé (coordenadas PDF têm Y=0 em baixo)
    grupos.sort((a, b) => b.y - a.y);

    return grupos.map(g => {
      g.items.sort((a, b) => a.transform[4] - b.transform[4]); // ordena por X
      return g.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
    }).filter(l => l.length > 0);
  },

  async parsearArquivo(file) {
    try {
      console.log('🔄 Iniciando parse de PDF:', file.name);

      const lib = await this._carregarLib();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await lib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      console.log('✅ PDF carregado, páginas:', pdf.numPages);

      const todasLinhas = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const pagina = await pdf.getPage(i);
        const conteudo = await pagina.getTextContent();
        const linhasPagina = this._reconstruirLinhas(conteudo.items);
        console.log(`📄 Página ${i}: ${linhasPagina.length} linhas reconstruídas`);
        linhasPagina.forEach((l, j) => console.log(`  [${j}] "${l}"`));
        todasLinhas.push(...linhasPagina);
      }

      console.log(`\n📋 Total de linhas extraídas: ${todasLinhas.length}`);
      const resultado = this.extrairTarefas(todasLinhas.join('\n'));
      console.log('🎯 Resultado final:', resultado);
      return resultado;

    } catch (erro) {
      console.error('❌ Erro ao parsear PDF:', erro);
      throw erro;
    }
  },

  extrairTarefas(texto) {
    console.log('\n📋 ===== DEBUG EXTRAÇÃO =====');
    console.log(texto);
    console.log('='.repeat(60));

    // ── Detecta mês/ano no cabeçalho ────────────────────────────────
    const mesMatch = /(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+(?:de\s+)?(\d{4})/i.exec(texto);
    let mesExtraido = null;
    if (mesMatch) {
      const nome = mesMatch[1].charAt(0).toUpperCase() + mesMatch[1].slice(1).toLowerCase();
      mesExtraido = `${nome} ${mesMatch[2]}`;
      console.log('📅 Mês detectado:', mesExtraido);
    }

    const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    console.log(`Total de linhas: ${linhas.length}`);

    // ── Identifica cabeçalhos de seção ──────────────────────────────
    // Exemplos reais: "SERVIÇOS EXECUTADOS CONCLUÍDOS"
    //                 "SERVIÇOS A SEREM EXECUTADOS ATÉ O DIA 30/04/2026"
    const ehCabecalhoSecao = (l) =>
      /SERVI[ÇC]OS\s+EXECUTADOS/i.test(l) ||
      /SERVI[ÇC]OS\s+A\s+SEREM/i.test(l);

    // ── Linhas que nunca são tarefas ────────────────────────────────
    const ehLinhaSistema = (l) =>
      /PROGRAMA[ÇC][ÃA]O\s+M[EÊ]S/i.test(l) ||       // "PROGRAMAÇÃO MÊS DE..."
      /^CRECHE\s+CRIA/i.test(l) ||                      // nome da creche
      /^CRIA\s+/i.test(l) ||                            // variante do nome
      /AT[EÉ]\s+O\s+DIA\s+\d{2}\/\d{2}/i.test(l) ||   // "ATÉ O DIA DD/MM"
      /^\d{2}\/\d{2}\/\d{4}$/.test(l) ||               // data solta
      /^P[AÁ]G(INA)?\s*\d/i.test(l) ||                 // nº de página
      l.length < 4;

    // ── Itera linha por linha ────────────────────────────────────────
    const tarefas = [];
    let emSecao = false;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];

      if (ehCabecalhoSecao(linha)) {
        emSecao = true;
        console.log(`🔖 Seção (linha ${i}): "${linha}"`);
        continue;
      }

      if (!emSecao) continue;

      if (ehLinhaSistema(linha)) {
        console.log(`  ⏭️ Sistema: "${linha}"`);
        continue;
      }

      // Converte CAPS para Title Case
      const descricao = linha
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .replace(/(^|\s)\S/g, c => c.toUpperCase());

      if (descricao.length >= 4 && descricao.length <= 300) {
        tarefas.push({ descricao, status: 'nao-iniciada' });
        console.log(`✅ Tarefa ${tarefas.length}: "${descricao}"`);
        if (tarefas.length >= 100) break;
      } else {
        console.log(`  ✗ Rejeitada (${descricao.length} chars): "${descricao}"`);
      }
    }

    console.log(`\n✅ FINAL: ${tarefas.length} tarefas extraídas`);
    console.log('='.repeat(60) + '\n');
    return { tarefas, mesExtraido };
  }
};

window.pdfParser = pdfParser;
console.log('✅ pdfParser carregado:', pdfParser);
