const form = document.getElementById("catForm");
const tagInput = document.getElementById("catTag");
const msgInput = document.getElementById("catMessage");
const resetBtn = document.getElementById("resetBtn");
const submitBtn = document.getElementById("submitBtn");
const catImage = document.getElementById("catImage");
const tagOut = document.getElementById("displayTag");
const successState = document.getElementById("successState");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorText = document.getElementById("errorMessage");
const charCount = document.getElementById("charCount");
const themeBtn = document.getElementById("themeToggle");
const favBtn = document.getElementById("favoriteBtn");
const historyFilter = document.getElementById("historyFilter");
const sortAZBtn = document.getElementById("sortAZBtn");
const sortLatestBtn = document.getElementById("sortLatestBtn");
const historyList = document.getElementById("historyList");
const gallery = document.getElementById("favoritesGallery");

const API = "https://cataas.com";
const THEME_KEY = "cat-app-theme";
const FAV_KEY = "cat-app-favorites";

let currentCat = null;
let tagHistory = [];
let sortMode = "latest";
let favorites = readFavs();

const view = (name) => {
  loadingState.classList.toggle("hidden", name !== "load");
  errorState.classList.toggle("hidden", name !== "err");
  successState.classList.toggle("hidden", name !== "success");
  emptyState.classList.toggle("hidden", name !== "empty");
};
const isFav = (url) => favorites.filter((x) => x.url === url).length > 0;
const safe = (s) =>
  String(s).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );

form.addEventListener("submit", onSubmit);
resetBtn.addEventListener("click", resetAll);
themeBtn.addEventListener("click", () =>
  setTheme(document.body.classList.contains("dark-theme") ? "light" : "dark"),
);
favBtn.addEventListener("click", toggleFav);
historyFilter.addEventListener("input", renderHistory);
sortAZBtn.addEventListener("click", () => ((sortMode = "az"), renderHistory()));
sortLatestBtn.addEventListener(
  "click",
  () => ((sortMode = "latest"), renderHistory()),
);
gallery.addEventListener("click", onGalleryClick);
msgInput.addEventListener(
  "input",
  () => (charCount.textContent = String(msgInput.value.length)),
);

boot();

function boot() {
  const saved = localStorage.getItem(THEME_KEY);
  const auto = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  setTheme(saved || auto);
  charCount.textContent = "0";
  renderHistory();
  renderFavs();
  paintFavBtn();
}

async function onSubmit(e) {
  e.preventDefault();
  const tag = tagInput.value.trim();
  const msg = msgInput.value.trim();
  if (!tag || !msg) return;

  tagHistory = [{ id: Date.now(), tag }, ...tagHistory];
  renderHistory();
  view("load");
  submitBtn.disabled = true;

  try {
    const url = await getCat(tag, msg);
    currentCat = { id: Date.now(), url, tag, message: msg };
    catImage.src = url;
    catImage.alt = `Cat with message - tag: ${tag}`;
    tagOut.textContent = `Tag: ${tag}`;
    paintFavBtn();
    view("success");
  } catch {
    errorText.textContent = "Oops. Cat ran away. Try again.";
    view("err");
  }

  submitBtn.disabled = false;
}

function getCat(tag, msg) {
  return new Promise((ok, no) => {
    const url = `${API}/cat/${encodeURIComponent(tag.toLowerCase())}/says/${encodeURIComponent(msg)}`;
    const img = new Image();
    img.onload = () => ok(url);
    img.onerror = () => no(new Error("cat missing"));
    img.src = url;
  });
}

function setTheme(mode) {
  const dark = mode === "dark";
  document.body.classList.toggle("dark-theme", dark);
  themeBtn.textContent = dark ? "Disable Dark Mode" : "Enable Dark Mode";
  themeBtn.setAttribute(
    "aria-label",
    dark ? "Disable dark mode" : "Enable dark mode",
  );
  localStorage.setItem(THEME_KEY, mode);
}

function resetAll() {
  form.reset();
  currentCat = null;
  catImage.src = "";
  catImage.alt = "Cat with message";
  tagOut.textContent = "";
  charCount.textContent = "0";
  paintFavBtn();
  view("empty");
}

function renderHistory() {
  const q = historyFilter.value.trim().toLowerCase();
  const sorted = [...tagHistory].sort((a, b) =>
    sortMode === "az" ? a.tag.localeCompare(b.tag) : b.id - a.id,
  );
  const shown = sorted.filter((x) => x.tag.toLowerCase().includes(q));
  historyList.innerHTML = shown.length
    ? shown.map((x) => `<li class="history-item">#${safe(x.tag)}</li>`).join("")
    : '<li class="history-empty">No tags found yet.</li>';
  sortAZBtn.disabled = sortMode === "az";
  sortLatestBtn.disabled = sortMode === "latest";
}

function paintFavBtn() {
  if (!currentCat) {
    favBtn.disabled = true;
    favBtn.textContent = "♡ Add to Favorites";
    return;
  }
  favBtn.disabled = false;
  favBtn.textContent = isFav(currentCat.url)
    ? "❤️ Favorited"
    : "♡ Add to Favorites";
}

function toggleFav() {
  if (!currentCat) return;
  favorites = isFav(currentCat.url)
    ? favorites.filter((x) => x.url !== currentCat.url)
    : [{ id: Date.now(), ...currentCat }, ...favorites];
  saveFavs();
  renderFavs();
  paintFavBtn();
}

function renderFavs() {
  gallery.innerHTML = favorites.length
    ? favorites
        .map(
          (x) => `
      <article class="favorite-card">
        <img src="${safe(x.url)}" alt="Favorite cat for tag ${safe(x.tag)}" class="favorite-image">
        <div class="favorite-meta">
          <p class="favorite-tag">#${safe(x.tag)}</p>
          <p class="favorite-message">${safe(x.message)}</p>
        </div>
        <button type="button" class="btn btn-secondary favorite-remove" data-id="${x.id}" aria-label="Remove favorite">🗑️ Remove</button>
      </article>`,
        )
        .join("")
    : '<p class="favorites-empty">No favorites yet. Save one from the cat result above.</p>';
}

function onGalleryClick(e) {
  const btn =
    e.target instanceof HTMLElement
      ? e.target.closest(".favorite-remove")
      : null;
  if (!btn) return;
  favorites = favorites.filter((x) => x.id !== Number(btn.dataset.id));
  saveFavs();
  renderFavs();
  paintFavBtn();
}

function readFavs() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
    return Array.isArray(raw)
      ? raw
          .filter((x) => x && x.id && x.url && x.tag && x.message)
          .map((x) => ({
            id: x.id,
            url: x.url,
            tag: x.tag,
            message: x.message,
          }))
      : [];
  } catch {
    return [];
  }
}

function saveFavs() {
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}
