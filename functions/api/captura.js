export async function onRequestPost(context) {
  // Configuração via Variáveis de Ambiente da Cloudflare Pages
  const BREVO_API_KEY = context.env.BREVO_API_KEY;
  const TELEGRAM_BOT_TOKEN = context.env.TELEGRAM_BOT_TOKEN || "8515239458:AAHRqT2Nxkmok_hn0jvRHOBaWzBVwqSQMQI";
  const TELEGRAM_CHAT_ID = context.env.TELEGRAM_CHAT_ID || "7192141006";
  const SENDER_EMAIL = "contato@andrecorreia01.com.br";
  const SENDER_NAME = "André Correia | Soluções Digitais & IA";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const data = await context.request.json();
    const { name, email, whatsapp, businessType } = data;

    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Por favor, informe um e-mail válido." }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name || "Empresário").trim();
    const cleanBusiness = (businessType || "Negócio Local").trim();
    const cleanWhatsApp = whatsapp ? whatsapp.replace(/\D/g, "") : "";

    // 1. Notificação Instantânea em Tempo Real no Telegram do André
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const tgText = `⚡ *NOVO LEAD CAPTURADO NO SITE!*

👤 *Nome:* ${cleanName}
📧 *E-mail:* ${cleanEmail}
🏢 *Negócio:* ${cleanBusiness}
📱 *WhatsApp:* ${cleanWhatsApp ? cleanWhatsApp : "Não informado"}
🌐 *Origem:* andrecorreia01.com.br
⏰ *Data/Hora:* ${new Date().toISOString()}`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: tgText,
            parse_mode: "Markdown"
          })
        });
      } catch (tgErr) {
        console.warn("Aviso Telegram Lead:", tgErr);
      }
    }

    // 2. Cadastrar contato e enviar e-mail no Brevo (se configurado nas env vars)
    if (BREVO_API_KEY) {
      try {
        await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: cleanEmail,
            listIds: [3],
            attributes: {
              NOME: cleanName,
              WHATSAPP: cleanWhatsApp,
              NEGOCIO: cleanBusiness
            },
            updateEnabled: true
          })
        });
      } catch (contactErr) {
        console.warn("Aviso Brevo Contact:", contactErr);
      }

      try {
        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #059669; padding: 24px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">André Correia • Soluções Digitais & IA</h1>
              <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;">Modernização Digital para Negócios em Portugal</p>
            </div>
            <div style="padding: 30px; color: #334155; line-height: 1.6; font-size: 15px;">
              <p>Olá, <strong>${cleanName}</strong>!</p>
              <p>Recebemos o seu pedido de demonstração para a modernização do seu <strong>${cleanBusiness}</strong>.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; font-weight: 700; color: #0f172a;">⚡ O que o ecossistema de IA faz pelo seu negócio:</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569;">
                  <li><strong>Atendimento em &lt; 2 segundos:</strong> Responde dúvidas, passa cardápio/preços e retém o cliente antes que ele vá para o concorrente.</li>
                  <li><strong>Agendamento Automático:</strong> Marca reservas, mesas ou consultas direto na agenda 24h por dia.</li>
                  <li><strong>Página Web de Alta Conversão:</strong> Rápida, bonita e 100% adaptada para telemóveis.</li>
                </ul>
              </div>
              <p>Quer ver uma demonstração prática funcionando em tempo real agora no seu WhatsApp?</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://wa.me/351933303995?text=Ol%C3%A1%20Andr%C3%A9,%20recebi%20o%20e-mail%20e%20gostaria%20de%20ver%20a%20demonstra%C3%A7%C3%A3o%20para%20o%20meu%20${encodeURIComponent(cleanBusiness)}" 
                   style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; display: inline-block;">
                  Testar Atendente no WhatsApp →
                </a>
              </div>
              <p style="font-size: 13px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
                André Correia | Setúbal & Grande Lisboa • Telemóvel: +351 933 303 995
              </p>
            </div>
          </div>
        `;

        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ name: cleanName, email: cleanEmail }],
            subject: `⚡ Demonstração de IA & Automação para o seu ${cleanBusiness}`,
            htmlContent: emailHtml
          })
        });
      } catch (emailErr) {
        console.warn("Aviso Brevo SMTP:", emailErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Demonstração solicitada com sucesso! Verifique a sua caixa de entrada e o WhatsApp." 
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
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
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
