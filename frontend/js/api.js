// ============================================
// API - Cliente HTTP
// ============================================

const api = {
  baseURL: localStorage.getItem('API_BASE_URL') || 'https://obras-cria.onrender.com',

  setBaseURL(url) {
    this.baseURL = url;
    localStorage.setItem('API_BASE_URL', url);
  },

  async request(caminho, opcoes = {}) {
    const url = `${this.baseURL}${caminho}`;
    const config = {
      headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) },
      ...opcoes
    };
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const resp = await fetch(url, config);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ erro: 'Erro na requisição' }));
      throw new Error(err.erro || `HTTP ${resp.status}`);
    }
    return resp.json();
  },

  // ====== OBRAS ======
  async listarObras() {
    return this.request('/obras');
  },

  async buscarObra(id) {
    return this.request(`/obras/${id}`);
  },

  async criarObra(obra) {
    return this.request('/obras', { method: 'POST', body: obra });
  },

  async atualizarObra(id, obra) {
    return this.request(`/obras/${id}`, { method: 'PUT', body: obra });
  },

  async removerObra(id) {
    return this.request(`/obras/${id}`, { method: 'DELETE' });
  },

  // ====== TAREFAS ======
  async listarTarefas(obraId) {
    return this.request(`/obras/${obraId}/tarefas`);
  },

  async criarTarefa(obraId, tarefa) {
    return this.request(`/obras/${obraId}/tarefas`, { method: 'POST', body: tarefa });
  },

  async atualizarTarefa(id, tarefa) {
    return this.request(`/tarefas/${id}`, { method: 'PUT', body: tarefa });
  },

  async removerTarefa(id) {
    return this.request(`/tarefas/${id}`, { method: 'DELETE' });
  },

  async importarTarefasPadrao(obraId) {
    return this.request(`/obras/${obraId}/tarefas/padrao`, { method: 'POST' });
  },

  // ====== RELATÓRIOS ======
  async listarRelatorios(obraId) {
    return this.request(`/obras/${obraId}/relatorios`);
  },

  async buscarRelatorio(id) {
    return this.request(`/relatorios/${id}`);
  },

  async criarRelatorio(obraId, relatorio) {
    return this.request(`/obras/${obraId}/relatorios`, { method: 'POST', body: relatorio });
  },

  async atualizarRelatorio(id, relatorio) {
    return this.request(`/relatorios/${id}`, { method: 'PUT', body: relatorio });
  },

  async removerRelatorio(id) {
    return this.request(`/relatorios/${id}`, { method: 'DELETE' });
  },

  async uploadFotos(relatorioId, fotosPendentes) {
    const formData = new FormData();
    const observacoes = [];
    for (const foto of fotosPendentes) {
      formData.append('fotos', foto.arquivo);
      observacoes.push(foto.observacao || '');
    }
    formData.append('observacoes', JSON.stringify(observacoes));
    return this.request(`/relatorios/${relatorioId}/fotos`, {
      method: 'POST',
      body: formData
    });
  },

  async atualizarObservacaoFoto(relatorioId, fotoId, observacao) {
    return this.request(`/relatorios/${relatorioId}/fotos/${fotoId}`, {
      method: 'PATCH',
      body: { observacao }
    });
  },

  async removerFoto(relatorioId, fotoId) {
    return this.request(`/relatorios/${relatorioId}/fotos/${fotoId}`, { method: 'DELETE' });
  },

  // Health check
  async verificarConexao() {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
};
