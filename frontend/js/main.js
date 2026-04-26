// ============================================
// MAIN - Bootstrap da aplicação
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // Status conexão inicial
  ui.atualizarStatusConexao(utils.estaOnline());

  // Listeners de conexão
  window.addEventListener('online', async () => {
    ui.atualizarStatusConexao(true);
    ui.sucesso('Conexão restaurada');
    await app.sincronizarDados();
    app.atualizarResumo();
  });

  window.addEventListener('offline', () => {
    ui.atualizarStatusConexao(false);
    ui.aviso('Modo offline');
  });

  // Navegação sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      app.navegarPara(view);
    });
  });

  // Toggle sidebar mobile
  document.getElementById('toggleSidebar')?.addEventListener('click', () => ui.alternarSidebar());

  // Fechar modais
  document.querySelectorAll('[data-fechar-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.fecharModal;
      ui.fecharModal(modalId);
    });
  });

  // Fecha modal clicando fora
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) ui.fecharModal(modal.id);
    });
  });

  // ESC fecha modais
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ui.fecharTodosModais();
  });

  // Botão Nova Obra
  document.getElementById('btnNovaObra')?.addEventListener('click', () => app.abrirNovaObra());

  // Form Obra
  document.getElementById('formObra')?.addEventListener('submit', (e) => app.salvarObra(e));

  // Botão Voltar
  document.getElementById('btnVoltarObras')?.addEventListener('click', () => app.navegarPara('obras'));

  // Editar/Excluir Obra
  document.getElementById('btnEditarObra')?.addEventListener('click', () => app.abrirEdicaoObra());
  document.getElementById('btnExcluirObra')?.addEventListener('click', () => app.excluirObra());

  // Abas
  document.querySelectorAll('.aba').forEach(aba => {
    aba.addEventListener('click', () => app.trocarAba(aba.dataset.aba));
  });

  // Editar observação de foto
document.getElementById('formEditarFoto')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('editarFotoId').value;
  const obs = document.getElementById('editarFotoObservacao').value;
  const persistida = document.getElementById('editarFotoObservacao').dataset.persistida === 'true';
  camera.salvarObservacaoFoto(id, obs, persistida);
  ui.fecharModal('modalEditarFoto');
  ui.sucesso('Observação salva');
});

  // Tarefas
  document.getElementById('btnImportarPadrao')?.addEventListener('click', () => app.importarTarefasPadrao());
  document.getElementById('btnNovaTarefa')?.addEventListener('click', () => tarefasManager.abrirNovo());
  document.getElementById('formTarefa')?.addEventListener('submit', (e) => tarefasManager.salvar(e));
  document.getElementById('btnExcluirTarefa')?.addEventListener('click', () => tarefasManager.excluir());

  // Relatórios
  document.getElementById('btnNovoRelatorio')?.addEventListener('click', () => app.abrirNovoRelatorio());
  document.getElementById('formRelatorio')?.addEventListener('submit', (e) => app.salvarRelatorio(e));
  document.getElementById('formEditarRelatorio')?.addEventListener('submit', (e) => app.salvarEdicaoRelatorio(e));

  // Gerar PDF do modal de relatório
  document.getElementById('btnGerarPDF')?.addEventListener('click', async () => {
    const id = document.getElementById('relatorioId').value;
    if (!id) {
      ui.aviso('Salve o relatório antes de gerar o PDF');
      return;
    }
    await pdf.gerarRelatorio(id);
  });

  // Câmera
  camera.iniciar();

  // Inicializa app
  await app.iniciar();
});
