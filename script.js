const catForm = document.getElementById('catForm');
const catTagInput = document.getElementById('catTag');
const catMessageInput = document.getElementById('catMessage');
const catImage = document.getElementById('catImage');
const displayTag = document.getElementById('displayTag');
const successState = document.getElementById('successState');
const emptyState = document.getElementById('emptyState');

const API_BASE_URL = 'https://cataas.com';

catForm.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const tag = catTagInput.value;
  const message = catMessageInput.value;
  
  await fetchAndDisplayCat(tag, message);
}

function fetchCatImage(tag, message) {
  return new Promise((resolve, reject) => {
    const imageUrl = `${API_BASE_URL}/cat/${encodeURIComponent(tag.toLowerCase())}/says/${encodeURIComponent(message)}`;
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}

async function fetchAndDisplayCat(tag, message) {
  const imageUrl = await fetchCatImage(tag, message);
  displayCat(imageUrl, tag);
}

function displayCat(url, tag) {
  catImage.src = url;
  catImage.alt = 'Cat with message - tag: ' + tag;
  displayTag.textContent = 'Tag: ' + tag;
  successState.classList.remove('hidden');
  emptyState.classList.add('hidden');
}