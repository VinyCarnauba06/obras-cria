// ============================================
// UTILS - Funções utilitárias
// ============================================

const utils = {
  // Gera UUID v4 simples
  gerarUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  // Formata data para pt-BR
  formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  formatarDataHora(data) {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Para input type="date"
  formatarDataInput(data) {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d)) return '';
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  },

  // Debounce
  debounce(fn, ms = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  },

  // Converte status tarefa em texto legível
  statusTexto(status) {
    const map = {
      'nao-iniciada': 'Não Iniciada',
      'em-andamento': 'Em Andamento',
      'concluida': 'Concluída',
      'nao-executada': 'Não Executada'
    };
    return map[status] || status;
  },

  // Próximo status (ciclo)
  proximoStatus(status) {
    const ciclo = ['nao-iniciada', 'em-andamento', 'concluida', 'nao-executada'];
    const idx = ciclo.indexOf(status);
    return ciclo[(idx + 1) % ciclo.length];
  },

  // Escape HTML
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  // Converte File para DataURL (Base64)
  arquivoParaDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Verifica online
  estaOnline() {
    return navigator.onLine;
  }
};
