// ============================================
// TAREFAS MANAGER - CRUD de tarefas
// ============================================

const tarefasManager = {
  obraAtualId: null,

  setObra(obraId) {
    this.obraAtualId = obraId;
    this.recarregar();
  },

  recarregar() {
    if (!this.obraAtualId) return;
    const tarefas = db.listarTarefas(this.obraAtualId);
    ui.renderizarListaTarefas(tarefas);
  },

  abrirNovo() {
    if (!this.obraAtualId) {
      ui.erro('Selecione uma obra primeiro');
      return;
    }
    document.getElementById('modalTarefaTitulo').textContent = 'Nova Tarefa';
    document.getElementById('tarefaId').value = '';
    document.getElementById('tarefaDescricao').value = '';
    document.getElementById('tarefaStatus').value = 'nao-iniciada';
    document.getElementById('tarefaObservacoes').value = '';
    document.getElementById('tarefaMotivoAtraso').value = '';
    document.getElementById('btnExcluirTarefa').style.display = 'none';
    ui.abrirModal('modalTarefa');
  },

  abrirEdicao(id) {
    const tarefa = db.buscarTarefa(id);
    if (!tarefa) return ui.erro('Tarefa não encontrada');

    document.getElementById('modalTarefaTitulo').textContent = 'Editar Tarefa';
    document.getElementById('tarefaId').value = id;
    document.getElementById('tarefaDescricao').value = tarefa.descricao || '';
    document.getElementById('tarefaStatus').value = tarefa.status || 'nao-iniciada';
    document.getElementById('tarefaObservacoes').value = tarefa.observacoes || '';
    document.getElementById('tarefaMotivoAtraso').value = tarefa.motivoAtraso || '';
    document.getElementById('btnExcluirTarefa').style.display = 'inline-flex';
    ui.abrirModal('modalTarefa');
  },

  async salvar(evento) {
    evento.preventDefault();

    const id = document.getElementById('tarefaId').value;
    const dados = {
      descricao: document.getElementById('tarefaDescricao').value.trim(),
      status: document.getElementById('tarefaStatus').value,
      observacoes: document.getElementById('tarefaObservacoes').value.trim(),
      motivoAtraso: document.getElementById('tarefaMotivoAtraso').value.trim()
    };

    if (!dados.descricao) {
      return ui.erro('Descrição é obrigatória');
    }

    try {
      if (id) {
        // Editar
        const existente = db.buscarTarefa(id);
        const atualizada = { ...existente, ...dados, dataAtualizacao: new Date().toISOString() };
        db.salvarTarefa(atualizada);

        if (utils.estaOnline() && existente._id) {
          try {
            const salva = await api.atualizarTarefa(existente._id, dados);
            db.salvarTarefa(salva);
          } catch (err) {
            db.adicionarNaFila({ tipo: 'PUT_TAREFA', id: existente._id, dados });
          }
        } else if (existente._id) {
          db.adicionarNaFila({ tipo: 'PUT_TAREFA', id: existente._id, dados });
        }
        ui.sucesso('Tarefa atualizada');
      } else {
        // Criar
        const nova = {
          ...dados,
          id: utils.gerarUUID(),
          obraId: this.obraAtualId,
          ativo: true,
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
          historico: []
        };
        db.salvarTarefa(nova);

        if (utils.estaOnline()) {
          try {
            const salva = await api.criarTarefa(this.obraAtualId, dados);
            // Atualiza local com _id do servidor
            db.removerTarefa(nova.id);
            db.salvarTarefa(salva);
          } catch (err) {
            db.adicionarNaFila({ tipo: 'POST_TAREFA', obraId: this.obraAtualId, idLocal: nova.id, dados });
          }
        } else {
          db.adicionarNaFila({ tipo: 'POST_TAREFA', obraId: this.obraAtualId, idLocal: nova.id, dados });
        }
        ui.sucesso('Tarefa criada');
      }

      ui.fecharModal('modalTarefa');
      this.recarregar();
      app.atualizarResumo();
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  },

  async excluir() {
    const id = document.getElementById('tarefaId').value;
    if (!id) return;

    if (!confirm('Excluir esta tarefa?')) return;

    try {
      const tarefa = db.buscarTarefa(id);
      db.removerTarefa(id);

      if (utils.estaOnline() && tarefa && tarefa._id) {
        try {
          await api.removerTarefa(tarefa._id);
        } catch (err) {
          db.adicionarNaFila({ tipo: 'DELETE_TAREFA', id: tarefa._id });
        }
      } else if (tarefa && tarefa._id) {
        db.adicionarNaFila({ tipo: 'DELETE_TAREFA', id: tarefa._id });
      }

      ui.fecharModal('modalTarefa');
      this.recarregar();
      ui.sucesso('Tarefa excluída');
    } catch (err) {
      ui.erro('Erro: ' + err.message);
    }
  }
};
