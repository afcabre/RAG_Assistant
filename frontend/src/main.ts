import "./styles.css";

type ChatRole = "user" | "assistant";

interface SourceReference {
  documentId: string;
  fileName: string;
  page: number;
}

interface AskResponse {
  answer: string;
  sources: SourceReference[];
  retrievedChunks: number;
}

interface UploadResponse {
  documentId: string;
  fileName: string;
  chunksStored: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("No se encontro #app");
}

app.innerHTML = `
  <main class="layout">
    <section class="panel panel-upload">
      <h1>RAG Assistant</h1>
      <p class="subtitle">Sube tus PDFs y consulta conocimiento con retrieval + Mistral Medium.</p>
      <form id="upload-form" class="upload-form">
        <label class="file-picker">
          <input id="pdf-input" type="file" accept="application/pdf" />
          <span>Seleccionar PDF</span>
        </label>
        <button id="upload-btn" type="submit">Procesar Documento</button>
      </form>
      <p id="upload-status" class="status"></p>
    </section>

    <section class="panel panel-chat">
      <div id="messages" class="messages"></div>
      <form id="chat-form" class="chat-form">
        <input id="question-input" type="text" placeholder="Haz una pregunta sobre tus documentos..." required />
        <button id="ask-btn" type="submit">Preguntar</button>
      </form>
    </section>
  </main>
`;

const uploadForm = document.querySelector<HTMLFormElement>("#upload-form");
const pdfInput = document.querySelector<HTMLInputElement>("#pdf-input");
const uploadStatus = document.querySelector<HTMLParagraphElement>("#upload-status");
const chatForm = document.querySelector<HTMLFormElement>("#chat-form");
const questionInput = document.querySelector<HTMLInputElement>("#question-input");
const messages = document.querySelector<HTMLDivElement>("#messages");

if (!uploadForm || !pdfInput || !uploadStatus || !chatForm || !questionInput || !messages) {
  throw new Error("No se pudieron inicializar los componentes del frontend");
}

const appendMessage = (role: ChatRole, content: string, sources: SourceReference[] = []): void => {
  const wrapper = document.createElement("article");
  wrapper.className = `message message-${role}`;

  const text = document.createElement("p");
  text.textContent = content;
  wrapper.appendChild(text);

  if (role === "assistant" && sources.length > 0) {
    const sourceList = document.createElement("ul");
    sourceList.className = "sources";
    sources.forEach((source) => {
      const item = document.createElement("li");
      item.textContent = `${source.fileName} (pagina ${source.page})`;
      sourceList.appendChild(item);
    });
    wrapper.appendChild(sourceList);
  }

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
};

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  uploadStatus.textContent = "";

  const selectedFile = pdfInput.files?.[0];
  if (!selectedFile) {
    uploadStatus.textContent = "Selecciona un PDF antes de continuar.";
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);

  uploadStatus.textContent = "Procesando documento...";
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Fallo upload (${response.status})`);
    }

    const data = (await response.json()) as UploadResponse;
    uploadStatus.textContent = `Documento cargado: ${data.fileName}. Chunks almacenados: ${data.chunksStored}.`;
  } catch (error) {
    uploadStatus.textContent = error instanceof Error ? error.message : "No se pudo subir el PDF";
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) {
    return;
  }

  appendMessage("user", question);
  questionInput.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question
      })
    });

    if (!response.ok) {
      throw new Error(`Fallo consulta (${response.status})`);
    }

    const data = (await response.json()) as AskResponse;
    appendMessage("assistant", data.answer, data.sources);
  } catch (error) {
    appendMessage("assistant", error instanceof Error ? error.message : "No se pudo consultar al asistente");
  }
});

