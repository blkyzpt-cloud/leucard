const DEFAULT_FLOWERS = [
  { emoji: '🌹', name: 'Rose', message: 'You are loved more than you know.' },
  { emoji: '🌻', name: 'Sunflower', message: 'Keep shining — your light matters.' },
  { emoji: '🌷', name: 'Tulip', message: 'New, good things are on their way to you.' },
  { emoji: '🌼', name: 'Daisy', message: 'Stay as sweet and joyful as you are.' },
  { emoji: '💐', name: 'Lily', message: 'Wishing you a year full of happiness.' },
];

const MAX_IMAGES = 15;

let selectedTheme = 'bubblegum';
let selectedImages = [];
let selectedMusic = null;

// ----- Theme picker -----
document.querySelectorAll('.theme-swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-swatch').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTheme = btn.dataset.theme;
  });
});

// ----- Image upload -----
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');

imageInput.addEventListener('change', () => {
  const chosen = Array.from(imageInput.files);
  if (chosen.length > MAX_IMAGES) {
    errorText.textContent = `You can upload up to ${MAX_IMAGES} photos — the first ${MAX_IMAGES} were kept.`;
    errorText.style.display = 'block';
  } else {
    errorText.style.display = 'none';
  }
  selectedImages = chosen.slice(0, MAX_IMAGES);
  imagePreview.innerHTML = '';
  selectedImages.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// ----- Music upload -----
const musicInput = document.getElementById('musicInput');
const musicName = document.getElementById('musicName');

musicInput.addEventListener('change', () => {
  selectedMusic = musicInput.files[0] || null;
  musicName.textContent = selectedMusic ? `🎶 ${selectedMusic.name}` : '';
});

// ----- Flower editor -----
const flowerEditor = document.getElementById('flower-editor');
let flowers = DEFAULT_FLOWERS.map((f) => ({ ...f }));

function renderFlowerEditor() {
  flowerEditor.innerHTML = '';
  flowers.forEach((flower, i) => {
    const row = document.createElement('div');
    row.className = 'flower-row';
    row.innerHTML = `
      <span class="emoji">${flower.emoji}</span>
      <input type="text" maxlength="140" value="${flower.message.replace(/"/g, '&quot;')}" data-index="${i}">
    `;
    flowerEditor.appendChild(row);
  });
  flowerEditor.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', (e) => {
      flowers[e.target.dataset.index].message = e.target.value;
    });
  });
}
renderFlowerEditor();

// ----- Candle slider -----
const candleRange = document.getElementById('candleRange');
const candleCount = document.getElementById('candleCount');
candleRange.addEventListener('input', () => {
  candleCount.textContent = candleRange.value;
});

// ----- Submit -----
const form = document.getElementById('card-form');
const submitBtn = document.getElementById('submitBtn');
const errorText = document.getElementById('errorText');
const resultPanel = document.getElementById('result-panel');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorText.style.display = 'none';

  const recipientName = document.getElementById('recipientName').value.trim();
  if (!recipientName) {
    errorText.textContent = 'Please add who this card is for.';
    errorText.style.display = 'block';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Wrapping it up...';

  const formData = new FormData();
  formData.append('recipientName', recipientName);
  formData.append('senderName', document.getElementById('senderName').value.trim());
  formData.append('message', document.getElementById('message').value.trim());
  formData.append('theme', selectedTheme);
  formData.append('numCandles', candleRange.value);
  formData.append('flowers', JSON.stringify(flowers));
  selectedImages.forEach((file) => formData.append('images', file));
  if (selectedMusic) formData.append('music', selectedMusic);

  try {
    const res = await fetch('/api/cards', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    const link = `${window.location.origin}/card/${data.id}`;

    document.getElementById('shareLink').value = link;
    document.getElementById('previewLink').href = link;
    resultPanel.style.display = 'block';
    resultPanel.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    errorText.textContent = "Something went wrong creating your card. Please try again.";
    errorText.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create card 🎂';
  }
});

document.getElementById('copyBtn').addEventListener('click', () => {
  const input = document.getElementById('shareLink');
  input.select();
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById('copyBtn');
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = original; }, 1500);
});
