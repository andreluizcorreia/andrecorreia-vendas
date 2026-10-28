export async function onRequestPost(context) {
  const TELEGRAM_BOT_TOKEN = context.env.TELEGRAM_BOT_TOKEN || "8515239458:AAHRqT2Nxkmok_hn0jvRHOBaWzBVwqSQMQI";
  const TELEGRAM_CHAT_ID = context.env.TELEGRAM_CHAT_ID || "7192141006";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-cal-signature-256",
    "Content-Type": "application/json"
  };

  try {
    const body = await context.request.json();
    const triggerEvent = body.triggerEvent || body.event || "BOOKING_CREATED";
    const payload = body.payload || body;

    // Extrair dados do evento e participante
    const title = payload.title || payload.eventTitle || "Demonstração Gratuita & Diagnóstico Digital (30 min)";
    
    let clientName = "Cliente";
    let clientEmail = "Não informado";
    let clientPhone = "Não informado";
    let clientNotes = "Sem observações adicionais";

    if (payload.attendees && payload.attendees.length > 0) {
      clientName = payload.attendees[0].name || clientName;
      clientEmail = payload.attendees[0].email || clientEmail;
    }

    // Extrair respostas do formulário customizado
    if (payload.responses) {
      if (payload.responses.name) clientName = payload.responses.name.value || payload.responses.name || clientName;
      if (payload.responses.email) clientEmail = payload.responses.email.value || payload.responses.email || clientEmail;
      if (payload.responses.phone || payload.responses.whatsapp) {
        clientPhone = (payload.responses.phone ? payload.responses.phone.value || payload.responses.phone : "") ||
                      (payload.responses.whatsapp ? payload.responses.whatsapp.value || payload.responses.whatsapp : "");
      }
      if (payload.responses.notes) clientNotes = payload.responses.notes.value || payload.responses.notes;
    }

    // Google Meet / Localização
    const meetUrl = (payload.metadata && payload.metadata.videoCallUrl) || 
                    payload.meetingUrl || 
                    payload.location || 
                    "Gerado automaticamente no Google Calendar";

    // Formatação de data
    const startTimeRaw = payload.startTime || payload.start;
    let formattedDate = startTimeRaw;
    try {
      if (startTimeRaw) {
        const d = new Date(startTimeRaw);
        formattedDate = d.toLocaleString("pt-PT", {
          timeZone: "Europe/Lisbon",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      }
    } catch (e) {
      formattedDate = startTimeRaw;
    }

    // Ícone e Título conforme o evento
    let eventEmoji = "📅";
    let eventStatus = "NOVO AGENDAMENTO CONFIRMADO!";
    if (triggerEvent.includes("RESCHEDULED")) {
      eventEmoji = "🔄";
      eventStatus = "REUNIÃO REAGENDADA!";
    } else if (triggerEvent.includes("CANCELLED")) {
      eventEmoji = "❌";
      eventStatus = "REUNIÃO CANCELADA!";
    }

    // 1. Notificação Instantânea no Telegram do André
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const tgText = `${eventEmoji} *${eventStatus} (CAL.COM)*

📌 *Evento:* ${title}
👤 *Cliente:* ${clientName}
📧 *E-mail:* ${clientEmail}
📱 *Contacto:* ${clientPhone}
🕒 *Data & Hora:* ${formattedDate}
🔗 *Link da Reunião:* ${meetUrl}
📝 *Notas/Desafio:* ${clientNotes}

⚡ _Agendado via Cal.com • André Correia Soluções Digitais & IA_`;

      try {
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
        console.warn("Aviso Telegram Cal.com:", tgErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      event: triggerEvent,
      message: "Webhook do Cal.com processado com sucesso!"
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
      "Access-Control-Allow-Headers": "Content-Type, x-cal-signature-256"
    }
  });
}
