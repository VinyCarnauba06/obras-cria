// ============================================
// APP - Lógica principal
// ============================================

const app = {
  obraAtualId: null,

  async iniciar() {
    // Sincroniza com backend se online
    await this.sincronizarDados();

    // Renderiza view inicial
    this.navegarPara('obras');
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
        <label class="checkbox-tarefa-item">
          <input type="checkbox" name="tarefaSelecionada" value="${id}"
            data-descricao="${utils.escapeHTML(t.descricao)}" data-status="${t.status}">
          <span class="checkbox-tarefa-label">${utils.escapeHTML(t.descricao)}</span>
          <span class="checkbox-tarefa-status ${t.status}">${utils.statusTexto(t.status)}</span>
        </label>`;
    }).join('');
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
    ).map(cb => ({ id: cb.value, descricao: cb.dataset.descricao, status: cb.dataset.status }));

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
            relatorioSalvo = srv;
            db.salvarRelatorio(srv);
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
            relatorioSalvo = srv;
            db.salvarRelatorio(srv);
          } catch {
            db.adicionarNaFila({ tipo: 'POST_RELATORIO', obraId: this.obraAtualId, dados });
          }
        } else {
          db.adicionarNaFila({ tipo: 'POST_RELATORIO', obraId: this.obraAtualId, dados });
        }
      }

      // Upload de fotos pendentes
if (camera.temArquivosPendentes() && utils.estaOnline() && relatorioSalvo._id) {
  ui.toast('Enviando fotos...');
  try {
    const fotosPendentes = camera.fotosPendentes;
    const arquivos = camera.obterFotosPendentes();
    const resp = await api.uploadFotos(relatorioSalvo._id, arquivos);

    // Mapeia observações
    resp.relatorio.fotos.forEach((fotoServidor, idx) => {
      if (fotosPendentes[idx] && fotosPendentes[idx].observacao) {
        fotoServidor.observacao = fotosPendentes[idx].observacao;
      }
    });

    relatorioSalvo = resp.relatorio;
    db.salvarRelatorio(resp.relatorio);
    camera.carregarFotos(resp.relatorio.fotos || []);
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
