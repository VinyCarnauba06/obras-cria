# 🏗️ Sistema de Supervisão de Obras

Sistema offline-first com tema **dark mode** para supervisão de obras (creches).
**Stack:** Vanilla JS (frontend) + Node.js/Express/MongoDB (backend) + Cloudinary.

---

## 📦 Setup Rápido (WSL2 / Linux)

### 1️⃣ Pré-requisitos

```bash
# Verificar Node.js (>=18)
node -v
npm -v

# Se não tiver, instalar Node 20 LTS no WSL2:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2️⃣ Backend

```bash
cd backend
npm install

# Copia o .env exemplo e edita com suas credenciais
cp .env.example .env
nano .env   # ou code .env

# Preencha:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/obras-db
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# Rodar em dev (hot-reload)
npm run dev

# Ou em produção
npm start
```

Backend sobe em: **http://localhost:5000**

### 3️⃣ Frontend

Em **outro terminal**:

```bash
cd frontend
npm install
npm start
```

Frontend sobe em: **http://localhost:8080**

---

## 🔑 Credenciais Necessárias

### MongoDB Atlas (grátis)
1. Crie conta em [cloud.mongodb.com](https://cloud.mongodb.com)
2. Crie um cluster M0 (grátis)
3. Em "Network Access" adicione `0.0.0.0/0` (ou seu IP)
4. Copie a connection string → cole em `MONGODB_URI`

### Cloudinary (grátis)
1. Crie conta em [cloudinary.com](https://cloudinary.com)
2. No Dashboard copie:
   - `Cloud Name` → `CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

---

## 🗂️ Estrutura

```
sistema-cria/
├── backend/
│   ├── src/
│   │   ├── api/          # Rotas REST (obras, tarefas, relatórios)
│   │   ├── config/       # DB + Cloudinary
│   │   ├── db/models/    # Schemas Mongoose
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── index.html
    ├── css/              # styles.css, componentes.css, responsive.css
    ├── js/               # Módulos Vanilla (camelCase)
    └── package.json
```

---

## 🚀 Funcionalidades

- ✅ CRUD Obras (criar, editar, soft-delete)
- ✅ CRUD Tarefas (status cíclico, histórico)
- ✅ CRUD Relatórios com upload de fotos (Cloudinary)
- ✅ Captura via câmera + seleção de arquivos
- ✅ Geração de PDF local (jsPDF + html2canvas)
- ✅ Offline-first (localStorage + fila de sync)
- ✅ Tema dark mode completo
- ✅ Responsivo mobile

---

## 🧪 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/obras` | Lista obras |
| POST | `/api/obras` | Cria obra |
| PUT | `/api/obras/:id` | Atualiza obra |
| DELETE | `/api/obras/:id` | Soft-delete obra |
| GET | `/api/obras/:obraId/tarefas` | Lista tarefas da obra |
| POST | `/api/obras/:obraId/tarefas` | Cria tarefa |
| PUT | `/api/tarefas/:id` | Atualiza tarefa |
| DELETE | `/api/tarefas/:id` | Soft-delete tarefa |
| GET | `/api/obras/:obraId/relatorios` | Lista relatórios |
| POST | `/api/obras/:obraId/relatorios` | Cria relatório |
| PUT | `/api/relatorios/:id` | Atualiza relatório |
| DELETE | `/api/relatorios/:id` | Remove relatório + fotos |
| POST | `/api/relatorios/:id/fotos` | Upload de fotos |
| DELETE | `/api/relatorios/:id/fotos/:fotoId` | Remove foto |
| GET | `/api/health` | Health check |

---

## 🔧 Comandos Úteis WSL2

```bash
# Abrir no VSCode
code .

# Matar processo na porta 5000 (se travar)
sudo kill -9 $(lsof -t -i:5000)

# Matar processo na porta 8080
sudo kill -9 $(lsof -t -i:8080)

# Ver logs em tempo real
npm run dev
```

---

**Bora pra produção! 🚀**
