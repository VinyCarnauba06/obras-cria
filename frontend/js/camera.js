const camera = {
  fotosPendentes: [],
  fotosRelatorio: [],

  iniciar() {
    const btnCamera  = document.getElementById('btnCapturarFoto');
    const inputFotos = document.getElementById('inputFotos');

    // inputFotos é acionado nativamente pelo <label for="inputFotos"> no HTML
    if (inputFotos) inputFotos.addEventListener('change', (e) => {
      this.processarArquivos(e.target.files);
      // reset para permitir selecionar os mesmos arquivos novamente
      setTimeout(() => { inputFotos.value = ''; }, 100);
    });

    if (btnCamera) {
      btnCamera.addEventListener('click', () => {
        const tmp = document.createElement('input');
        tmp.type = 'file';
        tmp.accept = 'image/*';
        tmp.setAttribute('capture', 'environment');
        tmp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(tmp);
        tmp.addEventListener('change', (e) => {
          this.processarArquivos(e.target.files);
          tmp.remove();
        });
        tmp.addEventListener('cancel', () => tmp.remove());
        tmp.click();
      });
    }
  },

  _obterTarefasDisponiveis() {
    return Array.from(
      document.querySelectorAll('#listaCheckboxesTarefas input[name="tarefaSelecionada"]:checked')
    ).map(cb => ({ id: cb.value, descricao: cb.dataset.descricao }));
  },

  async processarArquivos(arquivos) {
    if (!arquivos || arquivos.length === 0) return;
    for (const arq of arquivos) {
      if (!arq.type.startsWith('image/')) continue;
      const dataURL = await utils.arquivoParaDataURL(arq);
      this.fotosPendentes.push({
        id: utils.gerarUUID(),
        arquivo: arq,
        dataURL,
        nome: arq.name,
        observacao: '',
        tarefaId: null
      });
    }
    this.renderizar();
  },

  renderizar() {
    const grid = document.getElementById('gridFotos');
    if (!grid) return;

    const tarefas = this._obterTarefasDisponiveis();

    const todas = [
      ...this.fotosRelatorio.map(f => ({
        id: f._id || f.id,
        url: f.url,
        observacao: f.observacao || '',
        persistida: true,
        tarefaId: f.tarefaId || null
      })),
      ...this.fotosPendentes.map(f => ({
        id: f.id,
        url: f.dataURL,
        observacao: f.observacao || '',
        persistida: false,
        tarefaId: f.tarefaId || null
      }))
    ];

    if (todas.length === 0) {
      grid.innerHTML = '<p style="color:var(--cor-texto-mutado);grid-column:1/-1;text-align:center;padding:20px;">Nenhuma foto adicionada</p>';
      return;
    }

    const opcoesSelect = [
      '<option value="">📌 Geral (sem tarefa)</option>',
      ...tarefas.map(t => `<option value="${utils.escapeHTML(t.id)}">${utils.escapeHTML(t.descricao)}</option>`)
    ].join('');

    grid.innerHTML = todas.map(f => `
      <div class="foto-item-wrap">
        <div class="foto-item" data-foto-id="${f.id}" data-persistida="${f.persistida}">
          <img src="${f.url}" alt="Foto">
          <div class="foto-overlay">
            <button type="button" class="btn-foto-obs" data-foto-id="${f.id}" data-persistida="${f.persistida}" title="Observação">💬</button>
          </div>
          <button type="button" class="foto-remover" data-foto-id="${f.id}" data-persistida="${f.persistida}">×</button>
          ${f.observacao ? `<div class="foto-label">${utils.escapeHTML(f.observacao)}</div>` : ''}
        </div>
        <select class="foto-tarefa-select" data-foto-id="${f.id}" data-persistida="${f.persistida}" title="Vincular à tarefa">
          ${opcoesSelect}
        </select>
      </div>
    `).join('');

    grid.querySelectorAll('.foto-tarefa-select').forEach(sel => {
      const fotoId = sel.dataset.fotoId;
      const persistida = sel.dataset.persistida === 'true';
      const ref = persistida
        ? this.fotosRelatorio.find(f => (f._id || f.id) === fotoId)
        : this.fotosPendentes.find(f => f.id === fotoId);
      if (ref?.tarefaId) sel.value = ref.tarefaId;
      sel.addEventListener('change', () => {
        this._atualizarTarefaFoto(fotoId, sel.value || null, persistida);
      });
    });

    grid.querySelectorAll('.btn-foto-obs').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.abrirEditarObservacao(btn.dataset.fotoId, btn.dataset.persistida === 'true');
      });
    });

    grid.querySelectorAll('.foto-remover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removerFoto(btn.dataset.fotoId, btn.dataset.persistida === 'true');
      });
    });
  },

  _atualizarTarefaFoto(id, tarefaId, persistida) {
    if (!persistida) {
      const foto = this.fotosPendentes.find(f => f.id === id);
      if (foto) foto.tarefaId = tarefaId;
    } else {
      const foto = this.fotosRelatorio.find(f => (f._id || f.id) === id);
      if (foto) foto.tarefaId = tarefaId;
    }
  },

  abrirEditarObservacao(id, persistida) {
    const foto = persistida
      ? this.fotosRelatorio.find(f => (f._id || f.id) === id)
      : this.fotosPendentes.find(f => f.id === id);
    if (!foto) return;
    document.getElementById('editarFotoId').value = id;
    document.getElementById('editarFotoObservacao').value = foto.observacao || '';
    document.getElementById('editarFotoObservacao').dataset.persistida = persistida;
    ui.abrirModal('modalEditarFoto');
  },

  salvarObservacaoFoto(id, observacao, persistida) {
    if (!persistida) {
      const foto = this.fotosPendentes.find(f => f.id === id);
      if (foto) { foto.observacao = observacao; this.renderizar(); }
      return;
    }
    const foto = this.fotosRelatorio.find(f => (f._id || f.id) === id);
    if (!foto) return;
    foto.observacao = observacao;
    this.renderizar();

    const relatorioId = document.getElementById('relatorioId').value;
    if (relatorioId && utils.estaOnline()) {
      api.atualizarObservacaoFoto(relatorioId, id, observacao).catch(err => {
        console.error('Erro ao salvar observação:', err.message);
      });
    }
  },

  async removerFoto(id, persistida) {
    if (!persistida) {
      this.fotosPendentes = this.fotosPendentes.filter(f => f.id !== id);
      this.renderizar();
      return;
    }
    const relatorioId = document.getElementById('relatorioId').value;
    if (!relatorioId) return;
    if (!confirm('Remover esta foto?')) return;
    try {
      if (utils.estaOnline()) await api.removerFoto(relatorioId, id);
      this.fotosRelatorio = this.fotosRelatorio.filter(f => (f._id || f.id) !== id);
      this.renderizar();
      ui.sucesso('Foto removida');
    } catch (err) {
      ui.erro(`Erro ao remover: ${err.message}`);
    }
  },

  resetar() {
    this.fotosPendentes = [];
    this.fotosRelatorio = [];
    this.renderizar();
  },

  carregarFotos(fotos) {
    this.fotosRelatorio = fotos || [];
    this.fotosPendentes = [];
    this.renderizar();
  },

  obterFotosPendentes() {
    return this.fotosPendentes.map(f => ({
      id: f.id,
      arquivo: f.arquivo,
      nome: f.nome,
      observacao: f.observacao || '',
      tarefaId: f.tarefaId || null
    }));
  },

  obterFotosPersistidas() {
    return this.fotosRelatorio.map(f => ({
      _id: f._id,
      id: f.id,
      url: f.url,
      public_id: f.public_id,
      dataHora: f.dataHora,
      observacao: f.observacao || '',
      ordem: f.ordem || 0,
      tarefaId: f.tarefaId || null
    }));
  },

  obterFotosParaSalvar() {
    return this.obterFotosPersistidas();
  },

  temArquivosPendentes() {
    return this.fotosPendentes.length > 0;
  }
};
