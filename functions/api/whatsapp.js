export async function onRequestPost(context) {
  const DIFY_API_KEY = context.env.DIFY_API_KEY || "app-9jplei13sZ5Togce";
  const DIFY_API_URL = context.env.DIFY_API_URL || "https://dify.andrecorreia01.com.br/v1";

  const xmlHeaders = {
    "Content-Type": "text/xml; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    // Twilio envia dados como x-www-form-urlencoded
    const formData = await context.request.formData();
    const incomingMsg = formData.get("Body") || "";
    const sender = formData.get("From") || "cliente-whatsapp";
    const profileName = formData.get("ProfileName") || "Cliente";

    if (!incomingMsg.trim()) {
      return new Response("<Response></Response>", { status: 200, headers: xmlHeaders });
    }

    // 1. Chamar a API de Chat do Dify (RAG com 538 respostas em pt-PT)
    let botReply = "Olá! A nossa equipa André Correia Soluções Digitais & IA recebeu a sua mensagem e já lhe responderemos em breve.";

    try {
      const difyRes = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DIFY_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: { profile_name: profileName },
          query: incomingMsg,
          response_mode: "blocking",
          user: sender.replace(/\D/g, "") || "whatsapp-user"
        })
      });

      if (difyRes.ok) {
        const difyData = await difyRes.json();
        if (difyData.answer) {
          botReply = difyData.answer;
        }
      }
    } catch (difyErr) {
      console.warn("Aviso Dify WhatsApp Bridge:", difyErr);
    }

    // 2. Responder no formato oficial TwiML da Twilio
    const cleanReply = botReply
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${cleanReply}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: xmlHeaders
    });

  } catch (error) {
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>Olá! Tivemos uma breve oscilação de conexão. Pode reenviar a sua mensagem?</Message></Response>`, {
      status: 200,
      headers: xmlHeaders
    });
  }
}

export async function onRequestGet() {
  return new Response("Twilio WhatsApp <-> Dify AI Bridge Online", { status: 200 });
}
