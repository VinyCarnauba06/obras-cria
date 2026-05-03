# CRIA — Sistema de Gerenciamento de Obras

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/VinyCarnauba06/obras-cria)
[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-339933.svg?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Privado-red.svg)]()

App **offline-first** para supervisão de obras com geração automática de relatórios PDF por tarefa. Desenvolvido para engenheiros e fiscais de campo que trabalham com conectividade instável.

> Captura visitas, registra tarefas executadas, vincula fotos por tarefa e gera PDF profissional — mesmo sem internet.

---

## Sumário

- [Features](#-features)
- [Quickstart](#-quickstart)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Tech Stack](#-tech-stack)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Como Rodar](#-como-rodar)
- [Arquitetura](#-arquitetura)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contribuindo](#-contribuindo)

---

## ✨ Features

- **Offline-first** — dados persistidos em `localStorage` com fila de sincronização automática ao voltar online
- **Relatório por tarefa** — cada tarefa selecionada gera uma seção dedicada no PDF com observações e fotos vinculadas
- **Fotos vinculadas** — upload direto para Cloudinary; cada foto pode ser atribuída a uma tarefa específica ou marcada como "Geral"
- **PDF profissional** — gerado client-side com `jsPDF`; paleta azul/preto/branco, multi-página automático
- **Gestão de obras** — CRUD completo de obras, tarefas e relatórios de visita
- **Camera nativa** — captura de fotos via câmera do dispositivo (mobile-friendly)
- **Responsivo** — layout adaptado para uso em campo (tablet/mobile)

---

## ⚡ Quickstart

Pré-requisitos: Node.js ≥ 18, conta MongoDB Atlas, conta Cloudinary.

```bash
# 1. Clonar
git clone https://github.com/VinyCarnauba06/obras-cria.git
cd obras-cria

# 2. Instalar dependências
cd backend && npm install
cd ../frontend && npm install

# 3. Configurar variáveis de ambiente
cp backend/.env.example backend/.env
# edite backend/.env com suas credenciais

# 4. Rodar (na raiz)
cd ..
./run.sh
```

| Serviço  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:8080 |
| Backend  | http://localhost:5000 |

---

## 📁 Estrutura do Projeto

```
obras-cria/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── obras.js        # rotas /obras
│   │   │   ├── relatorios.js   # rotas /relatorios
│   │   │   └── tarefas.js      # rotas /tarefas
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   └── database.js
│   │   ├── db/models/
│   │   │   ├── Obra.js
│   │   │   ├── Relatorio.js
│   │   │   └── Tarefa.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── css/
│   │   ├── styles.css
│   │   ├── componentes.css
│   │   └── responsive.css
│   ├── js/
│   │   ├── app.js              # lógica principal
│   │   ├── api.js              # cliente HTTP
│   │   ├── db.js               # camada offline (localStorage)
│   │   ├── pdf.js              # geração de PDF
│   │   ├── camera.js           # captura de fotos
│   │   ├── tarefas-manager.js
│   │   ├── obra-resumo.js
│   │   └── ui.js
│   ├── index.html
│   └── package.json
├── run.sh
└── README.md
```

---

## 🛠 Tech Stack

| Camada     | Tecnologia                  | Versão   | Função                          |
|------------|-----------------------------|----------|---------------------------------|
| Backend    | Node.js / Express           | ^4.19    | API REST                        |
| Database   | MongoDB Atlas + Mongoose    | ^8.3     | Persistência de dados           |
| Storage    | Cloudinary + Multer         | ^1.41    | Upload e armazenamento de fotos |
| Frontend   | Vanilla JS / HTML5 / CSS3   | —        | UI sem framework                |
| PDF        | jsPDF                       | —        | Geração client-side             |
| Dev Server | http-server                 | ^14.1    | Serve estáticos localmente      |

---

## 🔑 Variáveis de Ambiente

Crie `backend/.env` a partir do template:

```bash
cp backend/.env.example backend/.env
```

```env
# Servidor
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/obras-cria

# Cloudinary
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# CORS (dev: * | prod: https://seu-dominio.vercel.app)
CORS_ORIGIN=*
```

> **Atenção:** nunca commite `.env` com credenciais reais. O arquivo está no `.gitignore`.

---

## 🚀 Como Rodar

### Desenvolvimento

```bash
# Backend (com hot-reload via nodemon)
cd backend
npm run dev

# Frontend (em outro terminal)
cd frontend
npm start
```

### Produção

O projeto usa **Render** (backend) + **Vercel** (frontend).

```bash
# Backend — deploy automático via push para main no Render
# Frontend — deploy automático via push para main no Vercel

# Para rodar produção localmente:
cd backend && npm start
cd frontend && npm start
```

---

## 🏗 Arquitetura

### Offline-First

O módulo `db.js` abstrai toda persistência local via `localStorage`. Operações de escrita entram numa **fila de sincronização** (`syncQueue`) e são enviadas ao servidor quando a conexão é restaurada.

```
[Ação do usuário]
      │
      ▼
  localStorage  ──── online? ───▶  POST /api/relatorios
      │                                   │
      │◀──────────── resposta ────────────┘
```

### Fluxo de Relatório

```
1. Selecionar obra
2. Marcar tarefas executadas
3. Adicionar observação por tarefa
4. Tirar/vincular fotos → cada foto recebe tarefaId (ou "Geral")
5. Gerar PDF → seções por tarefa + seção "Observações Gerais"
6. Salvar/sincronizar com backend
```

### Modelo de Dados (Relatório)

```js
{
  tarefasSelecionadas: [{ id, descricao, status, observacao }],
  fotos: [{ url, public_id, dataHora, observacao, ordem, tarefaId }],
  observacaoGeral: String
}
```

> `tarefaId: null` indica foto geral (não vinculada a tarefa específica).

Para mais detalhes, veja [RELATORIO_TECNICO.md](./RELATORIO_TECNICO.md).

---

## 🔧 Troubleshooting

**`CORS error` no frontend**

Verifique `CORS_ORIGIN` no `.env` do backend. Em dev, use `*`. Em prod, use a URL exata do Vercel.

**Fotos não sobem / erro 413**

O Cloudinary tem limite de 10MB por arquivo free tier. Comprima as imagens antes do upload ou upgrade o plano.

**PDF quebra em múltiplas tarefas**

Verifique se `jsPDF` está carregado via CDN no `index.html`. O módulo `pdf.js` depende do objeto global `jspdf.jsPDF`.

**Dados offline não sincronizam**

Abra o DevTools → Application → Local Storage e verifique a chave `syncQueue`. Se vazia, a fila foi processada. Se populada, verifique conectividade com o backend.

**`Cannot connect to MongoDB`**

Confirme que seu IP está na whitelist do MongoDB Atlas (Network Access → Add IP Address).

---

## 🗺 Roadmap

- [ ] Autenticação JWT por usuário/obra
- [ ] Dashboard com métricas por obra (progresso de tarefas)
- [ ] Export de relatórios em Excel
- [ ] Notificações push para relatórios pendentes
- [ ] Suporte a múltiplos fiscais por obra
- [ ] Histórico de versões de relatório

---

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch: `git checkout -b feature/minha-feature`
3. Commite suas mudanças: `git commit -m 'feat: minha feature'`
4. Push: `git push origin feature/minha-feature`
5. Abra um Pull Request

Siga [Conventional Commits](https://www.conventionalcommits.org/pt-br/) para mensagens de commit.

---

## 📄 License

Projeto privado — © 2024 Vinyc. Todos os direitos reservados.
