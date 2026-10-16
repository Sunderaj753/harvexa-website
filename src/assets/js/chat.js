(() => {
    const fab = document.getElementById('chat-fab');
    const box = document.getElementById('chat');
    const log = document.getElementById('chat-log');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const quick = document.getElementById('chat-quick');
    const close = document.getElementById('chat-close');

    const KB = [
        { k: ['ai', 'machine', 'ml', 'generative', 'automation'], a: 'We build generative AI, predictive models and intelligent automation. Want to discuss a use case? Use the contact form below.' },
        { k: ['cloud', 'devops', 'aws', 'azure', 'migration'], a: 'Our cloud team handles migration, CI/CD, infrastructure as code and reliability engineering.' },
        { k: ['software', 'web', 'app', 'mobile', 'develop'], a: 'We design and build web, mobile and enterprise software with modern architecture.' },
        { k: ['data', 'analytics', 'bi', 'dashboard'], a: 'We create data platforms, dashboards and real-time analytics to support better decisions.' },
        { k: ['security', 'cyber', 'compliance'], a: 'We offer security audits, threat detection and compliance support.' },
        { k: ['contact', 'email', 'phone', 'call', 'quote', 'price'], a: 'Email info@harvexatech.co.za or use the contact form. We reply within one business day.' },
        { k: ['hello', 'hi', 'hey'], a: 'Hello! How can I help you today?' }
    ];
    const FALLBACK = 'I can help with our services (AI, cloud, software, data, security) or how to contact us.';

    function add(text, who) {
        const el = document.createElement('div');
        el.className = 'msg ' + who;
        el.textContent = text;
        log.appendChild(el);
        log.scrollTop = log.scrollHeight;
    }

    function reply(text) {
        const t = text.toLowerCase();
        const hit = KB.find(e => e.k.some(w => new RegExp('\\b' + w + '\\b').test(t)));
        setTimeout(() => add(hit ? hit.a : FALLBACK, 'bot'), 450);
    }

    function send(text) {
        text = text.trim();
        if (!text) return;
        add(text, 'user');
        reply(text);
    }

    function toggle(open) {
        box.hidden = !open;
        fab.setAttribute('aria-expanded', String(open));
        if (open) {
            if (!log.children.length) add('Hi, I am the Harvexa AI assistant. Ask me about our services.', 'bot');
            input.focus();
        }
    }

    ['Services', 'AI', 'Cloud', 'Contact'].forEach(q => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = q;
        b.addEventListener('click', () => send(q));
        quick.appendChild(b);
    });

    fab.addEventListener('click', () => toggle(box.hidden));
    close.addEventListener('click', () => toggle(false));
    form.addEventListener('submit', e => { e.preventDefault(); send(input.value); input.value = ''; });
})();
