export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const data = await context.request.json();
    const userInput = (data.message || data.user_input || "").trim();
    const firstName = (data.first_name || "Visitante").trim();
    const businessType = (data.business_type || "Negócio Local").trim();

    if (!userInput) {
      return new Response(JSON.stringify({ error: "Mensagem vazia." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Chama o n8n Omnichannel Webhook no VPS
    const n8nUrl = "https://n8n.andrecorreia01.com.br/webhook/manychat-ai";
    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AndreCorreia-WebWidget/1.0"
      },
      body: JSON.stringify({
        user_input: userInput,
        first_name: firstName,
        channel: "website_widget",
        business_niche: businessType
      })
    });

    if (n8nResponse.ok) {
      const n8nData = await n8nResponse.json();
      const reply = n8nData.reply_text || 
                    (n8nData.content && n8nData.content.messages && n8nData.content.messages[0] ? n8nData.content.messages[0].text : null) ||
                    "Olá! Obrigado pelo contacto. Como posso ajudar a modernizar a sua empresa hoje?";

      return new Response(JSON.stringify({
        success: true,
        reply: reply
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Fallback gracioso
      return new Response(JSON.stringify({
        success: true,
        reply: "Olá! Seja muito bem-vindo. Criamos websites modernos ultra-rápidos e atendentes automáticos de IA para empresas locais em Portugal. Gostaria de ver uma demonstração gratuita no seu telemóvel?"
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({
      success: true,
      reply: "Olá! Posso ajudar a modernizar o seu negócio com um site moderno ou atendimento 24h no WhatsApp. Deseja agendar uma demonstração rápida sem compromisso?"
    }), {
      status: 200,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
