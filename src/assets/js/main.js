(() => {
    // Mobile menu
    const burger = document.getElementById('burger');
    const menu = document.getElementById('menu');
    burger.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        burger.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', e => {
        if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });

    document.getElementById('year').textContent = new Date().getFullYear();

    // Typing headline
    const words = ['intelligent software', 'AI-powered products', 'secure cloud platforms', 'data-driven solutions'];
    const el = document.getElementById('typed');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
        let w = 0, c = 0, del = false;
        (function tick() {
            const word = words[w];
            c += del ? -1 : 1;
            el.textContent = word.slice(0, c);
            let wait = del ? 40 : 80;
            if (!del && c === word.length) { del = true; wait = 1400; }
            else if (del && c === 0) { del = false; w = (w + 1) % words.length; wait = 300; }
            setTimeout(tick, wait);
        })();
    }

    // Scroll reveal and counters
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal').forEach(n => io.observe(n));

    document.querySelectorAll('[data-count]').forEach(n => {
        const target = +n.dataset.count;
        if (reduce) { n.textContent = target; return; }
        let cur = 0;
        const step = () => { cur = Math.min(target, cur + Math.ceil(target / 60)); n.textContent = cur; if (cur < target) requestAnimationFrame(step); };
        step();
    });

    // Contact form via fetch
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    form.addEventListener('submit', async e => {
        e.preventDefault();
        status.textContent = 'Sending...';
        try {
            const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error();
            form.reset();
            status.textContent = 'Thank you! We will be in touch shortly.';
        } catch {
            status.textContent = 'Something went wrong. Please email info@harvexatech.co.za.';
        }
    });
})();
