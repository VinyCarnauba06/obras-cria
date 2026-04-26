// ============================================
// UI - Interface, toasts, modais
// ============================================

const ui = {
  // ====== TOAST ======
  toast(mensagem, tipo = 'info', duracao = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.textContent = mensagem;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, duracao);
  },

  sucesso(msg) { this.toast(msg, 'sucesso'); },
  erro(msg) { this.toast(msg, 'erro'); },
  aviso(msg) { this.toast(msg, 'aviso'); },

  // ====== MODAIS ======
  abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('aberto');
      document.body.style.overflow = 'hidden';
    }
  },

  fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('aberto');
      document.body.style.overflow = '';
    }
  },

  fecharTodosModais() {
    document.querySelectorAll('.modal.aberto').forEach(m => {
      m.classList.remove('aberto');
    });
    document.body.style.overflow = '';
  },

  // ====== NAVEGAÇÃO ======
  mostrarView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => {
      v.style.display = 'none';
    });
    const view = document.getElementById(viewId);
    if (view) view.style.display = 'block';

    // Atualiza sidebar
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  },

  // ====== STATUS CONEXÃO ======
  atualizarStatusConexao(online) {
    const badge = document.getElementById('badgeStatus');
    if (!badge) return;
    if (online) {
      badge.textContent = '● Online';
      badge.classList.remove('offline');
      badge.classList.add('online');
    } else {
      badge.textContent = '● Offline';
      badge.classList.remove('online');
      badge.classList.add('offline');
    }
  },

  // ====== RENDERIZAÇÃO ======
  renderizarCardsObras(obras) {
    const grid = document.getElementById('gridObras');
    const vazio = document.getElementById('estadoVazioObras');
    if (!grid) return;

    if (!obras || obras.length === 0) {
      grid.innerHTML = '';
      if (vazio) vazio.style.display = 'block';
      return;
    }
    if (vazio) vazio.style.display = 'none';

    grid.innerHTML = obras.map(obra => {
      const id = obra._id || obra.id;
      const tarefas = db.listarTarefas(id);
      const relatorios = db.listarRelatorios(id);
      const concluidas = tarefas.filter(t => t.status === 'concluida').length;

      return `
        <article class="card-obra" data-obra-id="${id}">
          <h3>${utils.escapeHTML(obra.nome)}</h3>
          <p class="card-obra-endereco">${utils.escapeHTML(obra.endereco)}</p>
          <div class="card-obra-stats">
            <div class="card-obra-stat">
              <div class="card-obra-stat-valor">${tarefas.length}</div>
              <div class="card-obra-stat-label">Tarefas</div>
            </div>
            <div class="card-obra-stat">
              <div class="card-obra-stat-valor">${concluidas}</div>
              <div class="card-obra-stat-label">Concluídas</div>
            </div>
            <div class="card-obra-stat">
              <div class="card-obra-stat-valor">${relatorios.length}</div>
              <div class="card-obra-stat-label">Relatórios</div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Click no card
    grid.querySelectorAll('.card-obra').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.obraId;
        app.abrirObra(id);
      });
    });
  },

  renderizarListaTarefas(tarefas) {
    const lista = document.getElementById('listaTarefas');
    if (!lista) return;

    if (!tarefas || tarefas.length === 0) {
      lista.innerHTML = `
        <div class="estado-vazio">
          <div class="estado-vazio-icone">📋</div>
          <h3>Nenhuma tarefa</h3>
          <p>Adicione a primeira tarefa desta obra</p>
        </div>
      `;
      return;
    }

    lista.innerHTML = tarefas.map(t => {
      const id = t._id || t.id;
      return `
        <div class="item-tarefa" data-tarefa-id="${id}">
          <div class="tarefa-status-indicador ${t.status}"></div>
          <div class="tarefa-info">
            <div class="tarefa-descricao">${utils.escapeHTML(t.descricao)}</div>
            ${t.observacoes ? `<div class="tarefa-meta">${utils.escapeHTML(t.observacoes)}</div>` : ''}
          </div>
          <span class="tarefa-status-badge ${t.status}">${utils.statusTexto(t.status)}</span>
        </div>
      `;
    }).join('');

    lista.querySelectorAll('.item-tarefa').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.tarefaId;
        tarefasManager.abrirEdicao(id);
      });
    });
  },

  renderizarListaRelatorios(relatorios) {
    const lista = document.getElementById('listaRelatorios');
    if (!lista) return;

    if (!relatorios || relatorios.length === 0) {
      lista.innerHTML = `
        <div class="estado-vazio">
          <div class="estado-vazio-icone">📄</div>
          <h3>Nenhum relatório</h3>
          <p>Crie o primeiro relatório de visita</p>
        </div>
      `;
      return;
    }

    lista.innerHTML = relatorios.map(r => {
      const id = r._id || r.id;
      const qtdFotos = (r.fotos || []).length;
      return `
        <div class="item-relatorio" data-relatorio-id="${id}">
          <div class="relatorio-info">
            <div class="relatorio-data">${utils.formatarData(r.dataRelatorio)}</div>
            <div class="relatorio-meta">
              ${utils.escapeHTML(r.endereco || 'Sem local')} • ${qtdFotos} foto(s)
            </div>
          </div>
          <div class="relatorio-acoes">
            <button class="btn-icone" data-acao="pdf" title="Gerar PDF">📄</button>
            <button class="btn-icone" data-acao="editar" title="Editar">✏️</button>
            <button class="btn-icone btn-perigo" data-acao="excluir" title="Excluir">🗑️</button>
          </div>
        </div>
      `;
    }).join('');

    lista.querySelectorAll('.item-relatorio').forEach(item => {
      const id = item.dataset.relatorioId;
      item.querySelector('[data-acao="pdf"]').addEventListener('click', (e) => {
        e.stopPropagation();
        pdf.gerarRelatorio(id);
      });
      item.querySelector('[data-acao="editar"]').addEventListener('click', (e) => {
        e.stopPropagation();
        app.abrirEdicaoRelatorio(id);
      });
      item.querySelector('[data-acao="excluir"]').addEventListener('click', (e) => {
        e.stopPropagation();
        app.excluirRelatorio(id);
      });
    });
  },

  alternarSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('aberta');
  }
};
