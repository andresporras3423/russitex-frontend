import { useState, useRef, useEffect } from "react";



const products = [
  { name: "Monstera Deliciosa", price: "Desde $45.000", stock: true, emoji: "🌿" },
  { name: "Pothos Dorado", price: "$18.000", stock: true, emoji: "🍃" },
  { name: "Sansevieria", price: "Desde $25.000", stock: true, emoji: "🌱" },
  { name: "Helecho Boston", price: "$32.000", stock: false, emoji: "🌾" },
  { name: "Cactus Mixto x3", price: "$28.000", stock: true, emoji: "🌵" },
  { name: "Ficus Lyrata", price: "$120.000", stock: true, emoji: "🎋" },
];

const quickQuestions = [
  "¿Qué entretelas hay disponibles?",
  "¿Cuáles son los precios?",
  "¿Hacen envíos a Medellín?",
  "¿Tienen combos o descuentos?",
];

export default function App() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy el asistente de **Verde Raíz**. Puedo ayudarte con información sobre nuestros productos, precios, disponibilidad y todo lo relacionado con nuestra tienda. ¿En qué te puedo ayudar?",
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

     const response = await fetch("http://localhost:3001/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: apiMessages,
  }),
});

if (response.status === 429) {
  const data = await response.json()
  setMessages([...newMessages, { 
    role: "assistant", 
    content: data.error
  }])
  setLoading(false)
  return
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
    <div style={{ fontFamily: "'Georgia', serif", background: "#faf7f2", minHeight: "100vh", position: "relative" }}>

      {/* NAV */}
      <nav style={{ background: "#2d4a2d", padding: "0 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "22px" }}>🌿</span>
          <span style={{ color: "#c8e6c8", fontSize: "18px", fontWeight: "bold", letterSpacing: "1px" }}>Verde Raíz</span>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {["Inicio", "Catálogo", "Guías", "Blog", "Contacto"].map((item) => (
            <span key={item} style={{ color: "#a8d5a8", fontSize: "13px", cursor: "pointer", letterSpacing: "0.5px" }}>{item}</span>
          ))}
        </div>
        <div style={{ background: "#4a7c4a", color: "#e8f5e8", padding: "6px 16px", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}>
          🛒 Carrito (0)
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #2d4a2d 0%, #4a7c4a 50%, #6b9e6b 100%)", padding: "60px 2rem", textAlign: "center" }}>
        <p style={{ color: "#a8d5a8", fontSize: "13px", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "12px" }}>Tienda de plantas de interior · Bogotá</p>
        <h1 style={{ color: "#e8f5e8", fontSize: "42px", margin: "0 0 16px", fontWeight: "normal", lineHeight: 1.2 }}>Tu hogar merece<br /><em>más verde</em></h1>
        <p style={{ color: "#b8dab8", fontSize: "16px", margin: "0 0 32px" }}>Plantas, macetas y accesorios para transformar tus espacios</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <button style={{ background: "#c8e6c8", color: "#2d4a2d", border: "none", padding: "12px 28px", borderRadius: "24px", fontSize: "14px", cursor: "pointer", fontWeight: "bold" }}>
            Ver catálogo
          </button>
          <button style={{ background: "transparent", color: "#c8e6c8", border: "1.5px solid #6b9e6b", padding: "12px 28px", borderRadius: "24px", fontSize: "14px", cursor: "pointer" }}>
            Guías de cuidado
          </button>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 1.5rem" }}>
        <h2 style={{ color: "#2d4a2d", fontSize: "24px", fontWeight: "normal", textAlign: "center", marginBottom: "8px" }}>Productos destacados</h2>
        <p style={{ color: "#6b8f6b", textAlign: "center", fontSize: "14px", marginBottom: "36px" }}>Envío gratis en compras mayores a $80.000 en Bogotá</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
          {products.map((p) => (
            <div key={p.name} style={{ background: "white", borderRadius: "12px", border: "1px solid #e8f0e8", padding: "20px 16px", textAlign: "center", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>{p.emoji}</div>
              <p style={{ color: "#2d4a2d", fontSize: "13px", fontWeight: "bold", margin: "0 0 6px", lineHeight: 1.3 }}>{p.name}</p>
              <p style={{ color: "#4a7c4a", fontSize: "14px", margin: "0 0 8px", fontFamily: "monospace" }}>{p.price}</p>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px", background: p.stock ? "#e8f5e8" : "#fdecea", color: p.stock ? "#2d6a2d" : "#c0392b" }}>
                {p.stock ? "✓ Disponible" : "✗ Agotado"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT BUTTON */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: "24px", right: "24px",
            background: "#2d4a2d", color: "white", border: "none",
            borderRadius: "50px", padding: "14px 22px",
            display: "flex", alignItems: "center", gap: "8px",
            fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 20px rgba(45,74,45,0.4)",
            zIndex: 1000, fontFamily: "sans-serif",
          }}>
          <span style={{ fontSize: "18px" }}>💬</span>
          <span>¿Tienes dudas?</span>
        </button>
      )}

      {/* CHAT PANEL */}
      {open && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "360px", height: "520px",
          background: "white", borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 1000, fontFamily: "'Helvetica Neue', sans-serif",
          overflow: "hidden", border: "1px solid #e0eae0",
        }}>

          {/* Header */}
          <div style={{ background: "#2d4a2d", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#4a7c4a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🌿</div>
              <div>
                <p style={{ color: "#e8f5e8", fontSize: "14px", fontWeight: "bold", margin: 0 }}>Asistente Verde Raíz</p>
                <p style={{ color: "#a8d5a8", fontSize: "11px", margin: 0 }}>● En línea ahora</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#a8d5a8", fontSize: "20px", cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? "#2d4a2d" : "#f0f7f0",
                  color: m.role === "user" ? "#e8f5e8" : "#2d4a2d",
                  fontSize: "13px",
                  lineHeight: "1.5",
                }}
                  dangerouslySetInnerHTML={{ __html: renderMessage(m.content) }}
                />
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "#f0f7f0", padding: "10px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4a7c4a", animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick questions (only on first message) */}
            {messages.length === 1 && !loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                <p style={{ fontSize: "11px", color: "#6b8f6b", margin: "0 0 4px", letterSpacing: "0.5px" }}>PREGUNTAS FRECUENTES</p>
                {quickQuestions.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} style={{
                    background: "white", border: "1px solid #c8e0c8", borderRadius: "20px",
                    padding: "7px 14px", fontSize: "12px", color: "#2d4a2d", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit",
                  }}>{q}</button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #e8f0e8", display: "flex", gap: "8px", background: "white" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              style={{
                flex: 1, border: "1px solid #d0e4d0", borderRadius: "20px",
                padding: "9px 14px", fontSize: "13px", outline: "none",
                background: "#fafff8", color: "#2d4a2d", fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? "#2d4a2d" : "#c8e0c8",
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
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
