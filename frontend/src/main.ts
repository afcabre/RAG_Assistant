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
    <header class="topbar panel">
      <h1>RAG Assistant</h1>
      <p class="top-status"><span class="status-dot"></span>Online</p>
    </header>

    <section class="workspace">
      <aside class="controls panel">
        <h2>1. Ingest documents</h2>
        <p class="helper-text">Choose a PDF and process it to index chunks in Pinecone.</p>

        <div class="action-row">
          <button id="select-pdf-btn" class="btn btn-secondary" type="button">Select PDF</button>
          <button id="process-doc-btn" class="btn btn-primary" type="button" disabled>Process Doc</button>
          <input id="pdf-input" type="file" accept="application/pdf" />
        </div>

        <p id="upload-status" class="status status-idle">No document selected.</p>

        <section id="process-log" class="process-log">
          <header class="process-log-head">
            <div class="log-title-wrap">
              <span class="live-pulse" aria-hidden="true"></span>
              <h3>Process Log</h3>
            </div>
            <button id="toggle-log-btn" class="log-toggle" type="button" aria-expanded="true">Collapse</button>
          </header>
          <div id="log-lines" class="log-lines"></div>
        </section>
      </aside>

      <section class="chat panel">
        <header class="chat-head">
          <h2>2. Ask the assistant</h2>
          <p>Answers are grounded in retrieved context.</p>
        </header>

        <div id="messages" class="messages"></div>

        <form id="chat-form" class="composer">
          <input id="question-input" type="text" placeholder="Ask about your indexed documents..." required />
          <button id="ask-btn" class="send-btn" type="submit">Send</button>
        </form>
      </section>
    </section>
  </main>
`;

const selectPdfBtn = document.querySelector<HTMLButtonElement>("#select-pdf-btn");
const processDocBtn = document.querySelector<HTMLButtonElement>("#process-doc-btn");
const pdfInput = document.querySelector<HTMLInputElement>("#pdf-input");
const uploadStatus = document.querySelector<HTMLParagraphElement>("#upload-status");
const processLog = document.querySelector<HTMLElement>("#process-log");
const logLines = document.querySelector<HTMLDivElement>("#log-lines");
const toggleLogBtn = document.querySelector<HTMLButtonElement>("#toggle-log-btn");
const chatForm = document.querySelector<HTMLFormElement>("#chat-form");
const questionInput = document.querySelector<HTMLInputElement>("#question-input");
const messages = document.querySelector<HTMLDivElement>("#messages");

if (
  !selectPdfBtn ||
  !processDocBtn ||
  !pdfInput ||
  !uploadStatus ||
  !processLog ||
  !logLines ||
  !toggleLogBtn ||
  !chatForm ||
  !questionInput ||
  !messages
) {
  throw new Error("No se pudieron inicializar los componentes del frontend");
}

const setUploadStatus = (text: string, tone: "idle" | "loading" | "success" | "error"): void => {
  uploadStatus.textContent = text;
  uploadStatus.className = `status status-${tone}`;
};

const getClockTime = (): string =>
  new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date());

const appendLog = (message: string, tone: "info" | "ok" | "warn" | "error" = "info"): void => {
  const line = document.createElement("p");
  line.className = `log-line log-${tone}`;
  line.textContent = `[${getClockTime()}] ${message}`;
  logLines.appendChild(line);

  if (logLines.childElementCount > 30) {
    logLines.removeChild(logLines.firstElementChild as ChildNode);
  }

  logLines.scrollTop = logLines.scrollHeight;
};

const appendMessage = (role: ChatRole, content: string, sources: SourceReference[] = []): void => {
  const wrapper = document.createElement("article");
  wrapper.className = `message-block message-${role}`;

  if (role === "assistant") {
    const assistantHead = document.createElement("header");
    assistantHead.className = "assistant-head";
    assistantHead.innerHTML = `<span class="assistant-dot"></span><span>Assistant</span>`;
    wrapper.appendChild(assistantHead);
  }

  const bubble = document.createElement("div");
  bubble.className = `bubble bubble-${role}`;

  const text = document.createElement("p");
  text.className = "message-content";
  text.textContent = content;
  bubble.appendChild(text);

  if (role === "assistant" && sources.length > 0) {
    const sourceList = document.createElement("div");
    sourceList.className = "sources";
    sources.forEach((source) => {
      const item = document.createElement("span");
      item.className = "source-chip";

      const chipIcon = document.createElement("span");
      chipIcon.className = "chip-icon";
      chipIcon.textContent = "PDF";

      const chipText = document.createElement("span");
      chipText.textContent = `${source.fileName} • pag. ${source.page}`;

      item.append(chipIcon, chipText);
      sourceList.appendChild(item);
    });
    bubble.appendChild(sourceList);
  }

  wrapper.appendChild(bubble);

  const meta = document.createElement("p");
  meta.className = "message-meta";
  meta.textContent = `${getClockTime()} • ${role === "user" ? "SENT" : "READY"}`;
  wrapper.appendChild(meta);

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
};

const appendThinking = (): HTMLDivElement => {
  const thinking = document.createElement("div");
  thinking.className = "thinking";
  thinking.textContent = "Consulting knowledge base...";
  messages.appendChild(thinking);
  messages.scrollTop = messages.scrollHeight;
  return thinking;
};

selectPdfBtn.addEventListener("click", () => {
  appendLog("Opening local PDF selector...");
  pdfInput.click();
});

pdfInput.addEventListener("change", () => {
  const selectedFile = pdfInput.files?.[0];
  if (!selectedFile) {
    processDocBtn.disabled = true;
    setUploadStatus("No document selected.", "idle");
    appendLog("Selection cleared.", "warn");
    return;
  }
  processDocBtn.disabled = false;
  setUploadStatus(`Selected: ${selectedFile.name}`, "idle");
  appendLog(`File attached: ${selectedFile.name}`, "ok");
});

processDocBtn.addEventListener("click", async () => {
  const selectedFile = pdfInput.files?.[0];
  if (!selectedFile) {
    setUploadStatus("Pick a PDF first.", "error");
    appendLog("Process request rejected: no file selected.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile);

  processDocBtn.disabled = true;
  setUploadStatus("Processing document...", "loading");
  appendLog("Connecting to indexing pipeline...");
  appendLog(`Embedding ${selectedFile.name}...`);
  appendLog("Connecting to Vector DB...");

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Fallo upload (${response.status})`);
    }

    const data = (await response.json()) as UploadResponse;
    setUploadStatus(`Indexed ${data.fileName} (${data.chunksStored} chunks).`, "success");
    appendLog(`Indexing completed. chunksStored=${data.chunksStored}`, "ok");
  } catch (error) {
    setUploadStatus(error instanceof Error ? error.message : "Upload failed", "error");
    appendLog(error instanceof Error ? error.message : "Upload failed", "error");
  } finally {
    processDocBtn.disabled = false;
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) {
    return;
  }

  appendMessage("user", question);
  appendLog(`New query: "${question.slice(0, 64)}${question.length > 64 ? "..." : ""}"`);
  appendLog("Retrieving semantic context from Pinecone...");
  appendLog("Synthesizing response with Mistral...");
  questionInput.value = "";

  const thinking = appendThinking();
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
    thinking.remove();
    appendLog(`Response delivered with ${data.retrievedChunks} retrieved chunks.`, "ok");
    appendMessage("assistant", data.answer, data.sources);
  } catch (error) {
    thinking.remove();
    appendLog(error instanceof Error ? error.message : "Assistant query failed", "error");
    appendMessage("assistant", error instanceof Error ? error.message : "No se pudo consultar al asistente");
  }
});

toggleLogBtn.addEventListener("click", () => {
  const collapsed = processLog.classList.toggle("process-log-collapsed");
  toggleLogBtn.textContent = collapsed ? "Expand" : "Collapse";
  toggleLogBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
});

appendLog("Interface booted.");
appendLog("Awaiting document selection.");
appendMessage("assistant", "Upload a PDF, process it, and ask your first question. I will only answer with retrieved context.");
