// ============================================
// APP - Lógica principal
// ============================================

const app = {
  obraAtualId: null,
  _tarefasParsadasPDF: [],

  async iniciar() {
    console.log('🔍 App iniciando...');
    console.log('API_BASE_URL:', api.API_BASE_URL || 'NÃO DEFINIDA');
    
    // Sincroniza com backend se online
    console.log('🌐 Conectando ao servidor...');
    await this.sincronizarDados();
    
    console.log('✅ Sincronização completa');
  },

  async sincronizarDados() {
    if (!utils.estaOnline()) {
      console.log('Offline - usando dados locais');
      return;
    }

    try {
      const obras = await api.listarObras();
      db.mesclarDoServidor(db.chaves.obras, obras);

      // Para cada obra, carrega tarefas e relatórios
      const todasTarefas = [];
      const todosRelatorios = [];

      for (const obra of obras) {
        try {
          const [tarefas, relatorios] = await Promise.all([
            api.listarTarefas(obra._id),
            api.listarRelatorios(obra._id)
          ]);
          todasTarefas.push(...tarefas);
          todosRelatorios.push(...relatorios);
        } catch (err) {
          console.error(`Erro obra ${obra._id}:`, err);
        }
      }

      db.mesclarDoServidor(db.chaves.tarefas, todasTarefas);
      db.mesclarDoServidor(db.chaves.relatorios, todosRelatorios);

      // Processa fila de sync
      await this.processarFilaSync();
    } catch (err) {
      console.error('Erro sincronização:', err);
      ui.aviso('Erro ao sincronizar com servidor');
    }
  },

  async processarFilaSync() {
    const fila = db.obterFila();
    if (fila.length === 0) return;

    for (const op of fila) {
      try {
        if (op.tipo === 'POST_OBRA') {
          const salva = await api.criarObra(op.dados);
          db.salvarObra(salva);
        } else if (op.tipo === 'PUT_OBRA') {
          await api.atualizarObra(op.id, op.dados);
        } else if (op.tipo === 'DELETE_OBRA') {
          await api.removerObra(op.id);
        } else if (op.tipo === 'POST_TAREFA') {
          await api.criarTarefa(op.obraId, op.dados);
        } else if (op.tipo === 'PUT_TAREFA') {
          await api.atualizarTarefa(op.id, op.dados);
        } else if (op.tipo === 'DELETE_TAREFA') {
          await api.removerTarefa(op.id);
        } else if (op.tipo === 'POST_RELATORIO') {
          await api.criarRelatorio(op.obraId, op.dados);
        } else if (op.tipo === 'PUT_RELATORIO') {
          await api.atualizarRelatorio(op.id, op.dados);
        } else if (op.tipo === 'DELETE_RELATORIO') {
          await api.removerRelatorio(op.id);
        }
        db.removerDaFila(op.id);
      } catch (err) {
        console.error('Erro processando fila:', err);
      }
    }
  },

  navegarPara(view) {
    if (view === 'obras') {
      ui.mostrarView('viewObras');
      document.querySelector('.nav-item[data-view="obras"]')?.classList.add('active');
      this.atualizarListaObras();
    } else if (view === 'resumo') {
      ui.mostrarView('viewResumo');
      document.querySelector('.nav-item[data-view="resumo"]')?.classList.add('active');
      obraResumo.renderizar();
    } else if (view === 'obra-detalhe') {
      ui.mostrarView('viewObraDetalhe');
    }
  },

  atualizarListaObras() {
    const obras = db.listarObras();
    ui.renderizarCardsObras(obras);
  },

  atualizarResumo() {
    this.atualizarListaObras();
    obraResumo.renderizar();
  },

  // ====== OBRA - Abrir detalhe ======
  abrirObra(obraId) {
    const obra = db.buscarObra(obraId);
    if (!obra) return ui.erro('Obra não encontrada');

    this.obraAtualId = obraId;
    tarefasManager.setObra(obraId);

    document.getElementById('obraDetalheNome').textContent = obra.nome;
    document.getElementById('obraDetalheEndereco').textContent = obra.endereco;

    this.navegarPara('obra-detalhe');
    this.recarregarRelatorios();

    // Aba padrão = tarefas
    this.trocarAba('tarefas');
  },

  trocarAba(aba) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.aba-conteudo').forEach(c => c.classList.remove('ativa'));
    document.querySelector(`.aba[data-aba="${aba}"]`)?.classList.add('ativa');
    document.getElementById(`aba${aba.charAt(0).toUpperCase() + aba.slice(1)}`)?.classList.add('ativa');
  },

  // ====== OBRA - Criar/Editar ======
  abrirNovaObra() {
    document.getElementById('modalObraTitulo').textContent = 'Nova Obra';
    document.getElementById('obraId').value = '';
    document.getElementById('obraNome').value = '';
    document.getElementById('obraEndereco').value = '';
    document.getElementById('obraDescricao').value = '';
    ui.abrirModal('modalObra');
  },

  abrirEdicaoObra() {
    if (!this.obraAtualId) return;
    const obra = db.buscarObra(this.obraAtualId);
    if (!obra) return;

    document.getElementById('modalObraTitulo').textContent = 'Editar Obra';
    document.getElementById('obraId').value = this.obraAtualId;
    document.getElementById('obraNome').value = obra.nome || '';
    document.getElementById('obraEndereco').value = obra.endereco || '';
    document.getElementById('obraDescricao').value = obra.descricao || '';
    ui.abrirModal('modalObra');
  },

  async salvarObra(evento) {
    evento.preventDefault();
    const id = document.getElementById('obraId').value;
    const dados = {
      nome: document.getElementById('obraNome').value.trim(),
      endereco: document.getElementById('obraEndereco').value.trim(),
      descricao: document.getElementById('obraDescricao').value.trim()
    };

    if (!dados.nome || !dados.endereco) {
      return ui.erro('Nome e endereço são obrigatórios');
    }

    try {
      if (id) {
        const existente = db.buscarObra(id);
        const atualizada = { ...existente, ...dados };
        db.salvarObra(atualizada);

        if (utils.estaOnline() && existente._id) {
          try {
            const salva = await api.atualizarObra(existente._id, dados);
            db.salvarObra(salva);
          } catch {
            db.adicionarNaFila({ tipo: 'PUT_OBRA', id: existente._id, dados });
          }
        } else if (existente._id) {
          db.adicionarNaFila({ tipo: 'PUT_OBRA', id: existente._id, dados });
        }

        // Atualiza tela de detalhe
        document.getElementById('obraDetalheNome').textContent = dados.nome;
        document.getElementById('obraDetalheEndereco').textContent = dados.endereco;

        ui.sucesso('Obra atualizada');
      } else {
        const nova = {
          ...dados,
          id: utils.gerarUUID(),
          ativo: true,
          dataCriacao: new Date().toISOString()
        };
        db.salvarObra(nova);

        if (utils.estaOnline()) {
          try {
            const salva = await api.criarObra(dados);
            db.removerObra(nova.id);
            db.salvarObra(salva);
          } catch {
            db.adicionarNaFila({ tipo: 'POST_OBRA', idLocal: nova.id, dados });
          }
        } else {
          db.adicionarNaFila({ tipo: 'POST_OBRA', idLocal: nova.id, dados });
        }

        ui.sucesso('Obra criada');
      }

      ui.fecharModal('modalObra');
      this.atualizarListaObras();
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  },

  async excluirObra() {
    if (!this.obraAtualId) return;
    if (!confirm('Excluir esta obra e todos os seus dados?')) return;

    try {
      const obra = db.buscarObra(this.obraAtualId);
      db.removerObra(this.obraAtualId);

      if (utils.estaOnline() && obra && obra._id) {
        try {
          await api.removerObra(obra._id);
        } catch {
          db.adicionarNaFila({ tipo: 'DELETE_OBRA', id: obra._id });
        }
      } else if (obra && obra._id) {
        db.adicionarNaFila({ tipo: 'DELETE_OBRA', id: obra._id });
      }

      ui.sucesso('Obra removida');
      this.obraAtualId = null;
      this.navegarPara('obras');
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  },

  // ====== RELATÓRIOS ======
  recarregarRelatorios() {
    if (!this.obraAtualId) return;
    const rels = db.listarRelatorios(this.obraAtualId);
    ui.renderizarListaRelatorios(rels);
  },

  abrirNovoRelatorio() {
    if (!this.obraAtualId) return;
    const obra = db.buscarObra(this.obraAtualId);

    document.getElementById('modalRelatorioTitulo').textContent = 'Novo Relatório';
    document.getElementById('relatorioId').value = '';
    document.getElementById('relatorioData').value = utils.formatarDataInput(new Date());
    document.getElementById('relatorioSupervisor').value = 'Maurício Carnaúba';
    document.getElementById('relatorioEndereco').value = obra?.endereco || '';
    document.getElementById('relatorioObservacao').value = '';
    camera.resetar();
    this._renderizarCheckboxesTarefas();
    ui.abrirModal('modalRelatorio');
  },

  _renderizarCheckboxesTarefas() {
    const container = document.getElementById('listaCheckboxesTarefas');
    if (!container) return;
    const tarefas = db.listarTarefas(this.obraAtualId);
    if (!tarefas || tarefas.length === 0) {
      container.innerHTML = '<p style="color:var(--cor-texto-mutado);font-size:0.85rem;padding:4px 0;">Nenhuma tarefa cadastrada nesta obra.</p>';
      return;
    }
    container.innerHTML = tarefas.map(t => {
      const id = t._id || t.id;
      return `
        <div class="checkbox-tarefa-grupo">
          <label class="checkbox-tarefa-item">
            <input type="checkbox" name="tarefaSelecionada" value="${id}"
              data-descricao="${utils.escapeHTML(t.descricao)}" data-status="${t.status}">
            <span class="checkbox-tarefa-label">${utils.escapeHTML(t.descricao)}</span>
            <span class="checkbox-tarefa-status ${t.status}">${utils.statusTexto(t.status)}</span>
          </label>
          <div class="tarefa-obs-area" id="obsArea_${id}" style="display:none;">
            <textarea id="obsT_${id}" class="tarefa-obs-campo" rows="2"
              placeholder="Observação sobre esta tarefa neste relatório..."></textarea>
          </div>
        </div>`;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const obsArea = document.getElementById(`obsArea_${cb.value}`);
      cb.addEventListener('change', () => {
        if (obsArea) obsArea.style.display = cb.checked ? '' : 'none';
        if (!cb.checked) {
          const ta = document.getElementById(`obsT_${cb.value}`);
          if (ta) ta.value = '';
        }
        camera.renderizar();
      });
    });
  },

  async importarTarefasPadrao() {
    if (!this.obraAtualId) return;
    if (!confirm('Importar a programação padrão de 15 tarefas para esta obra?\nAtenção: a obra não pode ter tarefas existentes.')) return;

    if (!utils.estaOnline()) {
      return ui.aviso('É necessário estar online para importar a programação padrão.');
    }

    try {
      ui.toast('Importando tarefas...');
      const resp = await api.importarTarefasPadrao(this.obraAtualId);
      for (const t of resp.tarefas) db.salvarTarefa(t);
      tarefasManager.recarregar();
      ui.sucesso(`${resp.inseridas} tarefas importadas com sucesso!`);
    } catch (err) {
      if (err.message.includes('já possui tarefas')) {
        ui.aviso('Esta obra já possui tarefas. Exclua-as antes de importar o padrão.');
      } else {
        ui.erro('Erro ao importar: ' + err.message);
      }
    }
  },

  // ====== IMPORTAR PDF ======
  abrirModalImportarPDF() {
    if (!this.obraAtualId) return;

    const NOMES_MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                         'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const sel = document.getElementById('selectMesImport');
    if (sel) {
      sel.innerHTML = '';
      const agora = new Date();
      for (let i = 0; i < 12; i++) {
        const d = new Date(agora.getFullYear(), agora.getMonth() + i, 1);
        const label = `${NOMES_MESES[d.getMonth()]} ${d.getFullYear()}`;
        const opt = document.createElement('option');
        opt.value = label;
        opt.textContent = label;
        sel.appendChild(opt);
      }
      const optNovo = document.createElement('option');
      optNovo.value = '__novo__';
      optNovo.textContent = '+ Novo Mês';
      sel.appendChild(optNovo);
    }

    this._tarefasParsadasPDF = [];
    const inputFile = document.getElementById('inputPDFArquivo');
    if (inputFile) inputFile.value = '';
    const preview = document.getElementById('importPDFPreviewArea');
    if (preview) preview.style.display = 'none';
    const btnConfirmar = document.getElementById('btnConfirmarImportacao');
    if (btnConfirmar) btnConfirmar.disabled = true;

    ui.abrirModal('modalImportarPDF');
  },

  async validarEEnviarPDF() {
    const arquivo = document.getElementById('inputPDFArquivo')?.files[0];
    if (!arquivo) return ui.erro('Selecione um arquivo PDF');
    if (!arquivo.name.toLowerCase().endsWith('.pdf')) return ui.erro('O arquivo deve ter extensão .pdf');

    try {
      ui.toast('Analisando PDF...');
      const resp = await pdfParser.parsearArquivo(arquivo);
      this._tarefasParsadasPDF = resp.tarefas || [];

      const spanMes = document.getElementById('importMesDetectado');
      if (spanMes) {
        spanMes.textContent = resp.mesExtraido
          ? `Mês detectado no PDF: ${resp.mesExtraido}`
          : 'Mês não detectado — selecione manualmente.';
      }

      if (resp.mesExtraido) {
        const sel = document.getElementById('selectMesImport');
        if (sel) {
          const match = Array.from(sel.options).find(
            o => o.value.toLowerCase() === resp.mesExtraido.toLowerCase()
          );
          if (match) sel.value = match.value;
        }
      }

      const lista = document.getElementById('listaTarefasPreview');
      if (lista) {
        lista.innerHTML = this._tarefasParsadasPDF.map(t => `
          <li class="import-preview-item">
            <span class="import-status-badge ${t.status}">${utils.statusTexto(t.status)}</span>
            <span>${utils.escapeHTML(t.descricao)}</span>
          </li>`).join('');
      }

      const preview = document.getElementById('importPDFPreviewArea');
      if (preview) preview.style.display = 'block';

      const btnConfirmar = document.getElementById('btnConfirmarImportacao');
      if (btnConfirmar) btnConfirmar.disabled = this._tarefasParsadasPDF.length === 0;

      if (this._tarefasParsadasPDF.length === 0) {
        ui.aviso('Nenhuma tarefa encontrada. Verifique se o PDF segue o formato esperado.');
      } else {
        ui.sucesso(`${this._tarefasParsadasPDF.length} tarefas extraídas`);
      }
    } catch (err) {
      ui.erro('Erro ao analisar PDF: ' + err.message);
    }
  },

  async confirmarImportacaoPDF() {
    if (this._tarefasParsadasPDF.length === 0) return ui.aviso('Analise o PDF primeiro');

    const sel = document.getElementById('selectMesImport');
    let mesSelecionado = sel?.value || '';

    if (mesSelecionado === '__novo__') {
      mesSelecionado = (prompt('Digite o mês (ex: Julho 2026):') || '').trim();
      if (!mesSelecionado) return;
    }
    if (!mesSelecionado) return ui.erro('Selecione o mês de referência');

    const MESES_PT = {
      'janeiro': 0, 'fevereiro': 1, 'março': 2, 'abril': 3,
      'maio': 4, 'junho': 5, 'julho': 6, 'agosto': 7,
      'setembro': 8, 'outubro': 9, 'novembro': 10, 'dezembro': 11
    };
    const partes = mesSelecionado.toLowerCase().split(/\s+/);
    const mesNum = MESES_PT[partes[0]];
    const ano = parseInt(partes[1]);
    const dataCriacao = (mesNum !== undefined && !isNaN(ano))
      ? new Date(ano, mesNum, 1).toISOString()
      : new Date().toISOString();

    ui.toast('Salvando tarefas...');

    const tarefasPayload = this._tarefasParsadasPDF.map(t => ({
      descricao: t.descricao,
      status: t.status,
      mes: mesSelecionado,
      dataCriacao
    }));

    // Persiste localmente de imediato (offline-first)
    const idsLocais = [];
    for (const t of tarefasPayload) {
      const idLocal = utils.gerarUUID();
      idsLocais.push(idLocal);
      db.salvarTarefa({
        id: idLocal,
        obraId: this.obraAtualId,
        ...t,
        ativo: true,
        observacoes: '',
        historico: []
      });
    }

    if (utils.estaOnline()) {
      try {
        const resp = await api.importarTarefasPDF(this.obraAtualId, {
          tarefas: tarefasPayload
        });
        for (const idLocal of idsLocais) db.removerTarefa(idLocal);
        for (const srv of resp.tarefas) db.salvarTarefa(srv);
        ui.fecharModal('modalImportarPDF');
        tarefasManager.recarregar();
        ui.sucesso(`${resp.inseridas} tarefas importadas para ${mesSelecionado}!`);
      } catch {
        for (let i = 0; i < tarefasPayload.length; i++) {
          db.adicionarNaFila({ tipo: 'POST_TAREFA', obraId: this.obraAtualId, idLocal: idsLocais[i], dados: tarefasPayload[i] });
        }
        ui.fecharModal('modalImportarPDF');
        tarefasManager.recarregar();
        ui.aviso('Tarefas salvas localmente. Serão sincronizadas quando online.');
      }
    } else {
      for (let i = 0; i < tarefasPayload.length; i++) {
        db.adicionarNaFila({ tipo: 'POST_TAREFA', obraId: this.obraAtualId, idLocal: idsLocais[i], dados: tarefasPayload[i] });
      }
      ui.fecharModal('modalImportarPDF');
      tarefasManager.recarregar();
      ui.aviso(`${tarefasPayload.length} tarefas salvas localmente. Serão sincronizadas quando online.`);
    }
  },

  abrirEdicaoRelatorio(id) {
    const rel = db.buscarRelatorio(id);
    if (!rel) return ui.erro('Relatório não encontrado');

    document.getElementById('editarRelatorioId').value = id;
    document.getElementById('editarRelatorioData').value = utils.formatarDataInput(rel.dataRelatorio);
    document.getElementById('editarRelatorioEndereco').value = rel.endereco || '';
    document.getElementById('editarRelatorioObservacao').value = rel.observacaoGeral || '';
    ui.abrirModal('modalEditarRelatorio');
  },

  async salvarRelatorio(evento) {
    evento.preventDefault();
    const id = document.getElementById('relatorioId').value;

    const tarefasSelecionadas = Array.from(
      document.querySelectorAll('#listaCheckboxesTarefas input[name="tarefaSelecionada"]:checked')
    ).map(cb => ({
      id: cb.value,
      descricao: cb.dataset.descricao,
      status: cb.dataset.status,
      observacao: document.getElementById(`obsT_${cb.value}`)?.value.trim() || ''
    }));

    const dados = {
      dataRelatorio: document.getElementById('relatorioData').value,
      supervisor: document.getElementById('relatorioSupervisor').value.trim(),
      endereco: document.getElementById('relatorioEndereco').value.trim(),
      observacaoGeral: document.getElementById('relatorioObservacao').value.trim(),
      tarefasSelecionadas,
      fotos: camera.obterFotosParaSalvar()
    };

    if (!dados.dataRelatorio) return ui.erro('Data é obrigatória');

    try {
      let relatorioSalvo;
      if (id) {
        const existente = db.buscarRelatorio(id);
        relatorioSalvo = { ...existente, ...dados };
        db.salvarRelatorio(relatorioSalvo);

        if (utils.estaOnline() && existente._id) {
          try {
            const srv = await api.atualizarRelatorio(existente._id, dados);
            relatorioSalvo = { ...srv, tarefasSelecionadas: dados.tarefasSelecionadas };
            db.salvarRelatorio(relatorioSalvo);
          } catch {
            db.adicionarNaFila({ tipo: 'PUT_RELATORIO', id: existente._id, dados });
          }
        }
      } else {
        relatorioSalvo = {
          ...dados,
          id: utils.gerarUUID(),
          obraId: this.obraAtualId,
          ativo: true,
          fotos: [],
          status: 'rascunho',
          dataCriacao: new Date().toISOString()
        };
        db.salvarRelatorio(relatorioSalvo);

        if (utils.estaOnline()) {
          try {
            const srv = await api.criarRelatorio(this.obraAtualId, dados);
            db.removerRelatorio(relatorioSalvo.id);
            relatorioSalvo = { ...srv, tarefasSelecionadas: dados.tarefasSelecionadas };
            db.salvarRelatorio(relatorioSalvo);
          } catch {
            db.adicionarNaFila({ tipo: 'POST_RELATORIO', obraId: this.obraAtualId, dados });
          }
        } else {
          db.adicionarNaFila({ tipo: 'POST_RELATORIO', obraId: this.obraAtualId, dados });
        }
      }

      if (camera.temArquivosPendentes() && utils.estaOnline() && relatorioSalvo._id) {
        try {
          const arquivos = camera.obterFotosPendentes();
          const LOTE = 10;
          const totalLotes = Math.ceil(arquivos.length / LOTE);
          let relatorioAtualizado = null;

          for (let i = 0; i < arquivos.length; i += LOTE) {
            const lote = arquivos.slice(i, i + LOTE);
            const loteNum = Math.floor(i / LOTE) + 1;
            ui.toast(totalLotes > 1
              ? `Enviando fotos (${loteNum}/${totalLotes})...`
              : 'Enviando fotos...'
            );
            const resp = await api.uploadFotos(relatorioSalvo._id, lote);
            relatorioAtualizado = resp.relatorio;
          }

          if (relatorioAtualizado) {
            relatorioSalvo = { ...relatorioAtualizado, tarefasSelecionadas: dados.tarefasSelecionadas };
            db.salvarRelatorio(relatorioSalvo);
            camera.carregarFotos(relatorioAtualizado.fotos || []);
          }
        } catch (err) {
          ui.erro('Erro upload fotos: ' + err.message);
        }
      } else if (camera.temArquivosPendentes() && !utils.estaOnline()) {
        ui.aviso('Fotos serão enviadas quando online');
      }

      ui.fecharModal('modalRelatorio');
      this.recarregarRelatorios();
      this.atualizarListaObras();
      ui.sucesso('Relatório salvo');
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  },

  async salvarEdicaoRelatorio(evento) {
    evento.preventDefault();
    const id = document.getElementById('editarRelatorioId').value;
    const dados = {
      dataRelatorio: document.getElementById('editarRelatorioData').value,
      endereco: document.getElementById('editarRelatorioEndereco').value.trim(),
      observacaoGeral: document.getElementById('editarRelatorioObservacao').value.trim()
    };

    try {
      const existente = db.buscarRelatorio(id);
      const atualizado = { ...existente, ...dados };
      db.salvarRelatorio(atualizado);

      if (utils.estaOnline() && existente._id) {
        try {
          const srv = await api.atualizarRelatorio(existente._id, dados);
          db.salvarRelatorio(srv);
        } catch {
          db.adicionarNaFila({ tipo: 'PUT_RELATORIO', id: existente._id, dados });
        }
      } else if (existente._id) {
        db.adicionarNaFila({ tipo: 'PUT_RELATORIO', id: existente._id, dados });
      }

      ui.fecharModal('modalEditarRelatorio');
      this.recarregarRelatorios();
      ui.sucesso('Relatório atualizado');
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  },

  async excluirRelatorio(id) {
    if (!confirm('Excluir este relatório e todas as fotos?')) return;

    try {
      const rel = db.buscarRelatorio(id);
      db.removerRelatorio(id);

      if (utils.estaOnline() && rel && rel._id) {
        try {
          await api.removerRelatorio(rel._id);
        } catch {
          db.adicionarNaFila({ tipo: 'DELETE_RELATORIO', id: rel._id });
        }
      } else if (rel && rel._id) {
        db.adicionarNaFila({ tipo: 'DELETE_RELATORIO', id: rel._id });
      }

      this.recarregarRelatorios();
      this.atualizarListaObras();
      ui.sucesso('Relatório excluído');
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  }
};
