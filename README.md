# Asistente Virtual RAG (DDD + API-first)

Proyecto monorepo con backend desacoplado del frontend para construir un asistente virtual con Retrieval Augmented Generation.

## Stack

- Backend: TypeScript + Express + LangChain
- Vector Store: Pinecone
- LLM: Mistral Medium 3.1 (`mistral-medium-latest`)
- Embeddings: Mistral (`mistral-embed`)
- Frontend: Vite + TypeScript (cliente web simple)

## Estructura

```txt
.
├── backend
│   ├── openapi.yaml
│   └── src
│       ├── domain
│       ├── application
│       ├── infrastructure
│       └── api
├── frontend
│   └── src
├── Dockerfile
└── railway.json
```

## Variables de entorno (backend)

Crear `backend/.env` basado en `backend/.env.example`:

```env
PINECONE_API_KEY=[TU_PINECONE_KEY]
PINECONE_INDEX_NAME=[TU_INDEX_NAME]
PINECONE_NAMESPACE=rag-assistant-dev
MISTRAL_API_KEY=[TU_MISTRAL_KEY]
MISTRAL_MODEL=mistral-medium-latest
MISTRAL_EMBEDDING_MODEL=mistral-embed
DEFAULT_TOP_K=5
PORT=3000
```

## Ejecucion local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar backend:

```bash
npm run dev:backend
```

3. Levantar frontend (en otra terminal):

```bash
npm run dev:frontend
```

4. Frontend en `http://localhost:5173` y backend en `http://localhost:3000`.

## API-first

Especificacion OpenAPI en:

- `backend/openapi.yaml`

Endpoints:

- `POST /api/documents/upload`: recibe PDF multipart (`file`), lo trocea y lo indexa en Pinecone.
- `POST /api/chat/ask`: recibe `{ question, topK? }`, recupera contexto y responde con Mistral.
- `GET /health`: healthcheck.

## Despliegue en Railway

- Se incluye `Dockerfile` en raiz.
- `railway.json` fuerza builder por Dockerfile.
- El backend expone `PORT` (por defecto `3000`).
- Comando de inicio del contenedor: `npm run start` dentro de `backend`.
