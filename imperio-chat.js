(() => {
  const endpoint = 'https://imperio-atendimento-piloto.andreluizlimacorreia.workers.dev/web';
  const booking = 'https://cal.com/andre-luiz-lima-correia-v9ukuc/demonstracao-gratuita-diagnostico-digital-30-min';
  const session = crypto.randomUUID();
  const root = document.createElement('div');
  root.className = 'imperio-chat';
  root.innerHTML = '<button type="button" class="imperio-chat-open" aria-expanded="false" aria-controls="imperio-chat-panel">Fale com a nossa equipa</button><section id="imperio-chat-panel" aria-label="Atendimento Império Digital" hidden><header><strong>Império Digital</strong><button type="button" aria-label="Fechar atendimento">×</button></header><div class="imperio-chat-log" role="log" aria-live="polite"></div><p class="imperio-chat-notice">Atendimento automatizado por IA. Evite enviar dados sensíveis. <a href="/politica-de-privacidade.html">Privacidade</a></p><form><label class="imperio-chat-label" for="imperio-chat-message">A sua mensagem</label><input id="imperio-chat-message" name="message" maxlength="1000" required placeholder="Escreva a sua pergunta"><button type="submit">Enviar</button></form><a class="imperio-chat-book" target="_blank" rel="noopener noreferrer">Marcar demonstração</a></section>';
  document.body.append(root);
  const toggle = root.querySelector('.imperio-chat-open');
  const panel = root.querySelector('section');
  const log = root.querySelector('[role=log]');
  const form = root.querySelector('form');
  const input = form.elements.message;
  const submit = form.querySelector('button');
  const add = (message, author) => {
    const item = document.createElement('p');
    item.className = author;
    item.textContent = message;
    log.append(item);
    log.scrollTop = log.scrollHeight;
  };
  const open = (visible) => {
    panel.hidden = !visible;
    toggle.setAttribute('aria-expanded', String(visible));
    (visible ? input : toggle).focus();
  };
  root.querySelector('.imperio-chat-book').href = booking;
  add('Olá! Posso explicar como funciona o atendimento automático ou ajudar a encontrar um horário para uma demonstração.', 'agent');
  toggle.addEventListener('click', () => open(panel.hidden));
  panel.querySelector('header button').addEventListener('click', () => open(false));
  panel.addEventListener('keydown', event => { if (event.key === 'Escape') open(false); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || submit.disabled) return;
    add(text, 'visitor');
    input.value = '';
    submit.disabled = true;
    try {
      const response = await fetch(endpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:session,text}),signal:AbortSignal.timeout(25000)});
      const {reply}=await response.json();
      if(typeof reply!=='string') throw Error('Resposta indisponível');
      add(reply,'agent');
    } catch {
      add('Não consegui responder agora. Pode tentar novamente ou usar o botão de marcação.', 'agent');
    } finally { submit.disabled=false; input.focus(); }
  });
})();
