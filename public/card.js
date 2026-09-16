const PARTICLES_BY_THEME = {
  bubblegum: ['💗', '✨', '🎈'],
  sunset: ['✨', '🌤️', '🎈'],
  galaxy: ['⭐', '✨', '🌙'],
  garden: ['🌿', '🌸', '🍃'],
};

const DEFAULT_WISH = '🎉 Wish granted. Happy birthday! 🎉';

function getCardId() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

function spawnParticles(theme) {
  const field = document.getElementById('particleField');
  const set = PARTICLES_BY_THEME[theme] || PARTICLES_BY_THEME.bubblegum;
  const count = 34;
  for (let i = 0; i < count; i++) {
    const span = document.createElement('span');
    span.className = 'particle';
    span.textContent = set[Math.floor(Math.random() * set.length)];
    span.style.left = `${Math.random() * 100}%`;
    span.style.fontSize = `${16 + Math.random() * 22}px`;
    const duration = 10 + Math.random() * 12;
    span.style.animationDuration = `${duration}s`;
    // Negative delay starts each particle partway through its animation so the
    // sky is already full of movement on load, instead of everyone waiting
    // out a positive delay invisibly first.
    span.style.animationDelay = `-${Math.random() * duration}s`;
    field.appendChild(span);
  }
}

function burstConfetti(x, y) {
  if (typeof confetti !== 'function') return;
  confetti({
    particleCount: 60,
    spread: 65,
    origin: { x: x ?? 0.5, y: y ?? 0.5 },
    colors: ['#ff6f9c', '#ffcf5c', '#8fd9c4', '#b9a6dc'],
  });
}

async function loadCard() {
  const id = getCardId();
  const stage = document.getElementById('stage');
  try {
    const res = await fetch(`/api/cards/${id}`);
    if (!res.ok) throw new Error('not found');
    const card = await res.json();
    renderCard(card);
  } catch (err) {
    stage.innerHTML = `
      <div style="text-align:center;">
        <h1 style="font-family:'Fredoka',sans-serif;">Hmm, we couldn't find that card 💔</h1>
        <p>Double check the link, or ask the sender to resend it.</p>
      </div>`;
  }
}

function renderCard(card) {
  const body = document.getElementById('pageBody');
  body.classList.remove('theme-bubblegum');
  body.classList.add(`theme-${card.theme}`);
  spawnParticles(card.theme);

  document.getElementById('envName').textContent = card.recipientName;
  document.getElementById('greetingName').textContent = `Happy Birthday, ${card.recipientName}!`;
  document.getElementById('messageText').textContent = card.message || "Wishing you the happiest of days.";
  if (card.theme === 'garden') {
    document.getElementById('messageText').classList.add('handwritten-message');
  }
  document.getElementById('fromLine').textContent = card.senderName ? `— ${card.senderName}` : '';

  // Gallery
  if (card.images && card.images.length) {
    const gallery = document.getElementById('gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    card.images.forEach((src) => {
      const polaroid = document.createElement('div');
      polaroid.className = 'polaroid';
      const tilt = (Math.random() * 10 - 5).toFixed(1);
      polaroid.style.setProperty('--tilt', `${tilt}deg`);

      const pin = document.createElement('div');
      pin.className = 'pin';

      const img = document.createElement('img');
      img.src = src;
      img.alt = 'shared memory';
      img.addEventListener('click', () => {
        lightboxImg.src = src;
        lightbox.classList.add('show');
      });

      polaroid.appendChild(pin);
      polaroid.appendChild(img);
      gallery.appendChild(polaroid);
    });
    lightbox.addEventListener('click', () => {
      lightbox.classList.remove('show');
      lightboxImg.src = '';
    });
    document.getElementById('galleryPanel').hidden = false;

    // Arrow buttons scroll the strip by roughly one photo's width.
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const scrollStep = () => (gallery.firstElementChild ? gallery.firstElementChild.offsetWidth + 26 : 176);
    prevBtn.addEventListener('click', () => gallery.scrollBy({ left: -scrollStep(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => gallery.scrollBy({ left: scrollStep(), behavior: 'smooth' }));
  }

  // Music
  const audio = document.getElementById('bgMusic');
  const muteBtn = document.getElementById('muteBtn');
  if (card.music) {
    audio.src = card.music;
    muteBtn.hidden = false;
    muteBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play();
        muteBtn.textContent = '🔊';
      } else {
        audio.pause();
        muteBtn.textContent = '🔇';
      }
    });
  }

  // Bouquet
  const flowers = (card.flowers && card.flowers.length) ? card.flowers : [
    { emoji: '🌹', message: 'You are loved more than you know.' },
    { emoji: '🌻', message: 'Keep shining — your light matters.' },
    { emoji: '🌷', message: 'New, good things are on their way to you.' },
  ];
  const bouquet = document.getElementById('bouquet');
  const flowerMessage = document.getElementById('flowerMessage');
  flowers.forEach((flower) => {
    const btn = document.createElement('button');
    btn.className = 'flower-btn';
    btn.type = 'button';
    btn.textContent = flower.emoji;
    btn.addEventListener('click', (e) => {
      flowerMessage.textContent = flower.message;
      flowerMessage.classList.add('show');
      btn.classList.remove('picked');
      void btn.offsetWidth;
      btn.classList.add('picked');
      const rect = btn.getBoundingClientRect();
      burstConfetti(rect.left / window.innerWidth, rect.top / window.innerHeight);
    });
    bouquet.appendChild(btn);
  });

  // Cake / candles
  const candlesEl = document.getElementById('candles');
  const wishMessage = document.getElementById('wishMessage');
  let remaining = card.numCandles || 5;
  for (let i = 0; i < remaining; i++) {
    const c = document.createElement('button');
    c.className = 'candle lit';
    c.type = 'button';
    c.setAttribute('aria-label', 'Blow out candle');
    c.innerHTML = '<span class="flame"></span><span class="stick"></span><span class="smoke">💨</span>';
    c.addEventListener('click', () => {
      if (c.classList.contains('blown')) return;
      c.classList.add('blown');
      remaining -= 1;
      if (remaining === 0) {
        wishMessage.textContent = DEFAULT_WISH;
        wishMessage.classList.add('show');
        burstConfetti(0.5, 0.6);
        setTimeout(() => burstConfetti(0.25, 0.5), 200);
        setTimeout(() => burstConfetti(0.75, 0.5), 350);
      }
    });
    candlesEl.appendChild(c);
  }

  document.getElementById('footerNote').hidden = false;

  // Envelope interaction
  const envelope = document.getElementById('envelope');
  const stage = document.getElementById('stage');
  const content = document.getElementById('content');

  envelope.addEventListener('click', () => {
    if (envelope.classList.contains('opened')) return;
    envelope.classList.add('opened');
    burstConfetti(0.5, 0.25);

    if (card.music) {
      audio.play().catch(() => { /* autoplay may need a user gesture; the click provides one */ });
    }

    setTimeout(() => {
      stage.classList.add('hidden');
      content.hidden = false;
      requestAnimationFrame(() => content.classList.add('show'));
    }, 900);
  });
}

loadCard();
