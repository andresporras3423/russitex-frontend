import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL;

const quickQuestions = [
  "¿Qué entretelas hay disponibles?",
  "¿Cuáles son los precios?",
  "¿Hacen envíos a Medellín?",
  "¿Tienen combos o descuentos?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy **Rusti**, el asistente de Russitex. Puedo ayudarte con información sobre nuestros materiales, precios, disponibilidad y todo lo relacionado con la tienda. ¿En qué te puedo ayudar?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (response.status === 429) {
        const data = await response.json();
        setMessages([...newMessages, { role: "assistant", content: data.error }]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Lo siento, hubo un error al procesar tu consulta.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Hubo un problema de conexión. Por favor intenta de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: "24px", right: "98px",
            background: "#2C5C7C", color: "white", border: "none",
            borderRadius: "50px", padding: "14px 22px",
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 20px rgba(44,92,124,0.4)",
            zIndex: 1000, fontFamily: "'Mulish', sans-serif",
          }}>
          <span style={{ fontSize: "18px" }}>💬</span>
          <span>¿Tienes dudas?</span>
        </button>
      )}

      {open && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "360px", height: "520px",
          background: "white", borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 1000, fontFamily: "'Mulish', sans-serif",
          overflow: "hidden", border: "1px solid #E0D8CB",
        }}>
          <div style={{ background: "#2C5C7C", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#A95445", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🧵</div>
              <div>
                <p style={{ color: "#fff", fontSize: "14px", fontWeight: "bold", margin: 0 }}>Rusti · Asistente Russitex</p>
                <p style={{ color: "#D8C2A1", fontSize: "11px", margin: 0 }}>● En línea ahora</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#D8C2A1", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#2C5C7C" : "#F1EADC",
                  color: m.role === "user" ? "#fff" : "#3B302A",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
                  dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }}
                />
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#F1EADC", padding: "10px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2C5C7C", animation: "chatBounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                <p style={{ fontSize: "11px", color: "#6E665C", margin: "0 0 4px", letterSpacing: "0.5px" }}>PREGUNTAS FRECUENTES</p>
                {quickQuestions.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{
                    background: "white", border: "1px solid #E0D8CB", borderRadius: "20px",
                    padding: "7px 14px", fontSize: "12px", color: "#2C5C7C", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit",
                  }}>{q}</button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "12px 14px", borderTop: "1px solid #F1EADC", display: "flex", gap: "8px", background: "white" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              style={{
                flex: 1, border: "1px solid #E0D8CB", borderRadius: "20px",
                padding: "9px 14px", fontSize: "13px", outline: "none",
                background: "#FDFBF7", color: "#3B302A", fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? "#2C5C7C" : "#E8EFF4",
                border: "none", borderRadius: "50%", width: "38px", height: "38px",
                color: "white", cursor: input.trim() && !loading ? "pointer" : "default",
                fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "background 0.2s",
              }}>
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
