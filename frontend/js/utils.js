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

  // Formata data para pt-BR (evita bug de fuso: extrai direto da string)
  formatarData(data) {
    if (!data) return '';
    // Extrai "YYYY-MM-DD" da string sem converter timezone
    const str = typeof data === 'string' ? data : new Date(data).toISOString();
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return '';
    return `${m[3]}/${m[2]}/${m[1]}`;
  },

  formatarDataHora(data) {
    if (!data) return '';
    const str = typeof data === 'string' ? data : new Date(data).toISOString();
    const m = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
    // fallback para datas sem hora
    const dm = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dm) return `${dm[3]}/${dm[2]}/${dm[1]}`;
    return '';
  },

  // Para input type="date" — retorna "YYYY-MM-DD" sem ajuste de fuso
  formatarDataInput(data) {
    if (!data) return '';
    const str = typeof data === 'string' ? data : new Date(data).toISOString();
    const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
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
      'em-atraso': 'Em Atraso'
    };
    return map[status] || status;
  },

  // Próximo status (ciclo)
  proximoStatus(status) {
    const ciclo = ['nao-iniciada', 'em-andamento', 'concluida', 'em-atraso'];
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
