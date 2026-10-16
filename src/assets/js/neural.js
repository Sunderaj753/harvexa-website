(() => {
    const canvas = document.getElementById('neural');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mouse = { x: -999, y: -999 };
    let w, h, nodes = [], raf;

    function resize() {
        const r = canvas.getBoundingClientRect();
        const dpr = Math.min(devicePixelRatio || 1, 2);
        w = r.width; h = r.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(90, Math.floor((w * h) / 14000));
        nodes = Array.from({ length: count }, () => ({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5
        }));
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        for (const n of nodes) {
            if (!reduce) {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;
            }
        }
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < 130) {
                    ctx.strokeStyle = `rgba(14,165,233,${(1 - d / 130) * .35})`;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                }
            }
            const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
            if (md < 160) {
                ctx.strokeStyle = `rgba(2,132,199,${(1 - md / 160) * .6})`;
                ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(14,165,233,.8)';
            ctx.beginPath(); ctx.arc(a.x, a.y, 2.2, 0, 6.283); ctx.fill();
        }
        if (!reduce) raf = requestAnimationFrame(draw);
    }

    canvas.parentElement.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduce) draw();
    });
    resize(); draw();
})();
