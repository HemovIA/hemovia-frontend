import { MessageCircle, RotateCcw, Send } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { http } from "./http";

const questionLimit = 1000;
const priorMessageLimit = 8;
const faqUrl = "https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue/faq";
const suggestedQuestions = [
  "Quais são os requisitos para doar sangue?",
  "Como me preparo para a primeira doação?",
  "Onde posso doar sangue?",
];

type Source = { title: string; url: string };
type ChatAnswer = { answer: string; sources: Source[] };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

export function DonorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    const log = transcript.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, pendingQuestion]);

  async function sendQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || request.current) return;

    const controller = new AbortController();
    request.current = controller;
    setFailed(false);
    setPendingQuestion(question);
    setDraft("");
    composer.current?.focus();

    const outgoing = { role: "user", content: question } as const;
    const recent = messages.slice(-priorMessageLimit).map(({ role, content }) => ({
      role,
      content: content.slice(0, questionLimit).replace(/[\uD800-\uDBFF]$/, ""),
    }));

    try {
      const { answer, sources } = await http<ChatAnswer>(
        "/donation-chat/messages",
        "POST",
        { messages: [...recent, outgoing] },
        { signal: controller.signal, timeoutMs: 45000 },
      );
      if (controller.signal.aborted) return;
      setMessages((history) => [...history, outgoing, { role: "assistant", content: answer, sources }]);
    } catch {
      if (controller.signal.aborted) return;
      setDraft(draft);
      setFailed(true);
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPendingQuestion("");
      }
    }
  }

  function startConversation() {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setDraft("");
    setPendingQuestion("");
    setFailed(false);
    composer.current?.focus();
  }

  return (
    <section className="card donor-chat" aria-labelledby="donor-chat-heading">
      <header className="donor-chat-header">
        <div className="donor-chat-title">
          <span className="donor-chat-icon"><MessageCircle aria-hidden="true" size={21} /></span>
          <h2 id="donor-chat-heading">Assistente de doação</h2>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={startConversation}
          disabled={!messages.length && !pendingQuestion && !draft}
        >
          <RotateCcw aria-hidden="true" size={15} />
          Nova conversa
        </button>
      </header>
      <p className="muted donor-chat-intro">
        Tire dúvidas sobre doação de sangue no Brasil com o assistente de IA. A triagem do hemocentro confirma se você pode doar.
      </p>

      <div
        ref={transcript}
        className="donor-chat-log"
        role="log"
        aria-label="Conversa com o assistente"
        tabIndex={messages.length ? 0 : undefined}
      >
        {messages.map(({ role, content, sources }, index) => (
          <div className={`donor-chat-message ${role}`} key={index}>
            <strong>{role === "user" ? "Você" : "Assistente"}</strong>
            <p>{content}</p>
            {!!sources?.length && (
              <ul aria-label="Fontes oficiais">
                {sources.filter(({ url }) => url.startsWith("https://")).map(({ title, url }) => (
                  <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{title}</a></li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {pendingQuestion && (
          <div className="donor-chat-message user">
            <strong>Você</strong>
            <p>{pendingQuestion}</p>
          </div>
        )}
      </div>
      <div className="donor-chat-status muted" role="status">
        {pendingQuestion && "Buscando orientação…"}
      </div>

      {!messages.length && !pendingQuestion && !failed && (
        <div className="donor-chat-suggestions" role="group" aria-label="Perguntas sugeridas">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              className="secondary"
              type="button"
              onClick={() => {
                setDraft(question);
                composer.current?.focus();
              }}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <form className="donor-chat-form" onSubmit={sendQuestion}>
        {failed && (
          <div className="donor-chat-error" role="alert">
            <p>O assistente está indisponível no momento. Tente novamente ou consulte as perguntas frequentes.</p>
            <a href={faqUrl} target="_blank" rel="noopener noreferrer">FAQ do Ministério da Saúde</a>
          </div>
        )}
        <label htmlFor="donor-chat-question">Sua pergunta</label>
        <textarea
          ref={composer}
          id="donor-chat-question"
          rows={3}
          maxLength={questionLimit}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          readOnly={!!pendingQuestion}
          spellCheck={false}
          autoComplete="off"
          aria-describedby="donor-chat-privacy"
        />
        <div className="donor-chat-form-footer">
          <p className="muted" id="donor-chat-privacy">Evite informar dados pessoais. O histórico fica nesta conversa.</p>
          <button type="submit" className="primary" disabled={!draft.trim() || !!pendingQuestion}>
            <Send aria-hidden="true" size={15} />
            {failed ? "Tentar novamente" : "Enviar pergunta"}
          </button>
        </div>
      </form>
    </section>
  );
}
