// ============================================
// DB - localStorage (offline-first)
// ============================================

const db = {
  chaves: {
    obras: 'obras',
    tarefas: 'tarefas',
    relatorios: 'relatorios',
    filaSync: 'fila_sync',
    config: 'config'
  },

  // Leitura genérica
  ler(chave) {
    try {
      const dados = localStorage.getItem(chave);
      return dados ? JSON.parse(dados) : [];
    } catch (e) {
      console.error('Erro lendo localStorage:', e);
      return [];
    }
  },

  escrever(chave, dados) {
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
      return true;
    } catch (e) {
      console.error('Erro escrevendo localStorage:', e);
      return false;
    }
  },

  // ====== OBRAS ======
  listarObras() {
    return this.ler(this.chaves.obras).filter(o => o.ativo !== false);
  },

  buscarObra(id) {
    return this.listarObras().find(o => o._id === id || o.id === id);
  },

  salvarObra(obra) {
    const obras = this.ler(this.chaves.obras);
    const id = obra._id || obra.id;
    const idx = obras.findIndex(o => (o._id || o.id) === id);
    if (idx >= 0) {
      obras[idx] = { ...obras[idx], ...obra };
    } else {
      obras.push(obra);
    }
    this.escrever(this.chaves.obras, obras);
    return obra;
  },

  removerObra(id) {
    const obras = this.ler(this.chaves.obras);
    const idx = obras.findIndex(o => (o._id || o.id) === id);
    if (idx >= 0) {
      obras[idx].ativo = false;
      this.escrever(this.chaves.obras, obras);
    }
  },

  // ====== TAREFAS ======
  listarTarefas(obraId = null) {
    const tarefas = this.ler(this.chaves.tarefas).filter(t => t.ativo !== false);
    return obraId ? tarefas.filter(t => t.obraId === obraId) : tarefas;
  },

  buscarTarefa(id) {
    return this.ler(this.chaves.tarefas).find(t => (t._id || t.id) === id);
  },

  salvarTarefa(tarefa) {
    const tarefas = this.ler(this.chaves.tarefas);
    const id = tarefa._id || tarefa.id;
    const idx = tarefas.findIndex(t => (t._id || t.id) === id);
    if (idx >= 0) {
      tarefas[idx] = { ...tarefas[idx], ...tarefa };
    } else {
      tarefas.push(tarefa);
    }
    this.escrever(this.chaves.tarefas, tarefas);
    return tarefa;
  },

  removerTarefa(id) {
    const tarefas = this.ler(this.chaves.tarefas);
    const idx = tarefas.findIndex(t => (t._id || t.id) === id);
    if (idx >= 0) {
      tarefas[idx].ativo = false;
      this.escrever(this.chaves.tarefas, tarefas);
    }
  },

  // ====== RELATÓRIOS ======
  listarRelatorios(obraId = null) {
    const rels = this.ler(this.chaves.relatorios).filter(r => r.ativo !== false);
    return obraId ? rels.filter(r => r.obraId === obraId) : rels;
  },

  buscarRelatorio(id) {
    return this.ler(this.chaves.relatorios).find(r => (r._id || r.id) === id);
  },

  salvarRelatorio(relatorio) {
    const rels = this.ler(this.chaves.relatorios);
    const id = relatorio._id || relatorio.id;
    const idx = rels.findIndex(r => (r._id || r.id) === id);
    if (idx >= 0) {
      rels[idx] = { ...rels[idx], ...relatorio };
    } else {
      rels.push(relatorio);
    }
    this.escrever(this.chaves.relatorios, rels);
    return relatorio;
  },

  removerRelatorio(id) {
    const rels = this.ler(this.chaves.relatorios);
    const idx = rels.findIndex(r => (r._id || r.id) === id);
    if (idx >= 0) {
      rels[idx].ativo = false;
      this.escrever(this.chaves.relatorios, rels);
    }
  },

  // ====== FILA SYNC ======
  adicionarNaFila(operacao) {
    const fila = this.ler(this.chaves.filaSync);
    fila.push({ ...operacao, id: utils.gerarUUID(), timestamp: Date.now() });
    this.escrever(this.chaves.filaSync, fila);
  },

  obterFila() {
    return this.ler(this.chaves.filaSync);
  },

  limparFila() {
    this.escrever(this.chaves.filaSync, []);
  },

  removerDaFila(id) {
    const fila = this.ler(this.chaves.filaSync).filter(f => f.id !== id);
    this.escrever(this.chaves.filaSync, fila);
  },

  // Substitui entidade local com dados do servidor
  mesclarDoServidor(chave, dadosServidor) {
    this.escrever(chave, dadosServidor);
  }
};
