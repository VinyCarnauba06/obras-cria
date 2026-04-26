// ============================================
// OBRA RESUMO - Estatísticas gerais
// ============================================

const obraResumo = {
  renderizar() {
    const grid = document.getElementById('gridEstatisticas');
    if (!grid) return;

    const obras = db.listarObras();
    const todasTarefas = db.listarTarefas();
    const todosRelatorios = db.listarRelatorios();

    const tarefasConcluidas = todasTarefas.filter(t => t.status === 'concluida').length;
    const tarefasAndamento = todasTarefas.filter(t => t.status === 'em-andamento').length;
    const tarefasPendentes = todasTarefas.filter(t => t.status === 'nao-iniciada').length;
    const tarefasNaoExecutadas = todasTarefas.filter(t => t.status === 'nao-executada').length;

    const totalFotos = todosRelatorios.reduce((acc, r) => acc + (r.fotos?.length || 0), 0);

    const cards = [
      { label: 'Obras Ativas', valor: obras.length, meta: 'Total cadastrado' },
      { label: 'Tarefas', valor: todasTarefas.length, meta: `${tarefasConcluidas} concluídas` },
      { label: 'Em Andamento', valor: tarefasAndamento, meta: 'Tarefas em progresso' },
      { label: 'Pendentes', valor: tarefasPendentes, meta: 'Não iniciadas' },
      { label: 'Não Executadas', valor: tarefasNaoExecutadas, meta: 'Canceladas/Bloqueadas' },
      { label: 'Relatórios', valor: todosRelatorios.length, meta: `${totalFotos} foto(s)` }
    ];

    grid.innerHTML = cards.map(c => `
      <div class="card-estatistica">
        <div class="card-estatistica-label">${c.label}</div>
        <div class="card-estatistica-valor">${c.valor}</div>
        <div class="card-estatistica-meta">${c.meta}</div>
      </div>
    `).join('');
  }
};
