const searchForm = document.getElementById("search-form");
const usernameInput = document.getElementById("username-input");
const searchResults = document.getElementById("search-results");

function clearResults() {
  searchResults.innerHTML = "";
}

function showMessage(text, variant) {
  clearResults();
  const el = document.createElement("p");
  el.className = "results-message";
  if (variant === "error") el.classList.add("results-message--error");
  if (variant === "loading") el.classList.add("results-message--loading");
  if (variant === "muted") el.classList.add("results-message--muted");
  el.textContent = text;
  searchResults.appendChild(el);
}

function formatUuid(id) {
  if (!id) return id;
  const compact = String(id).replace(/-/g, "").toLowerCase();
  if (compact.length !== 32 || !/^[0-9a-f]{32}$/.test(compact)) return String(id);
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

function toUndashedUuid(id) {
  return String(id).replace(/-/g, "").toLowerCase();
}

/**
 * Mojang has no API to resolve a player from a skin texture hash alone.
 * We support: exact username, UUID (dashed/undashed), or URLs/text that contain a player UUID (e.g. Crafatar).
 */
function parseSearchQuery(raw) {
  const t = raw.trim();
  if (!t) return { type: "empty" };

  if (/^[0-9a-f]{64}$/i.test(t)) {
    return { type: "skin_hash_unsupported" };
  }

  if (/textures\.minecraft\.net\/texture\/[0-9a-f]{64}/i.test(t)) {
    return { type: "skin_hash_unsupported" };
  }

  const standardUuid = t.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
  if (standardUuid) {
    return { type: "uuid", id: toUndashedUuid(standardUuid[0]) };
  }

  if (/^[0-9a-f]{32}$/i.test(t)) {
    return { type: "uuid", id: t.toLowerCase() };
  }

  const embeddedDashed = t.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (embeddedDashed) {
    return { type: "uuid", id: toUndashedUuid(embeddedDashed[0]) };
  }

  let match32;
  const re32 = /[0-9a-f]{32}/gi;
  while ((match32 = re32.exec(t)) !== null) {
    const hit = match32[0];
    const i = match32.index;
    const before = i > 0 ? t[i - 1] : "";
    const after = i + 32 < t.length ? t[i + 32] : "";
    const partOf64 = /[0-9a-f]/i.test(before) || /[0-9a-f]/i.test(after);
    if (!partOf64) {
      return { type: "uuid", id: hit.toLowerCase() };
    }
  }

  return { type: "username", name: t };
}

function truncateMiddle(str, maxLen) {
  if (str.length <= maxLen) return str;
  const keep = maxLen - 3;
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${str.slice(0, head)}...${str.slice(str.length - tail)}`;
}

function isProfileSuccess(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.name === "string" &&
    typeof data.id === "string" &&
    data.id.length > 0 &&
    !data.errorMessage
  );
}

function normalizeProfileForCard(data) {
  return {
    name: data.name,
    id: toUndashedUuid(data.id)
  };
}

function renderPlayerCard(profile) {
  const card = document.createElement("article");
  card.className = "player-card";

  const skinWrap = document.createElement("div");
  skinWrap.className = "player-card__skin-wrap";

  const img = document.createElement("img");
  img.className = "player-card__skin";
  img.alt = `Skin for ${profile.name}`;
  img.loading = "lazy";
  img.src = `https://crafatar.com/avatars/${encodeURIComponent(toUndashedUuid(profile.id))}?size=128&overlay`;

  const placeholder = document.createElement("div");
  placeholder.className = "player-card__skin-placeholder";
  placeholder.textContent = profile.name.charAt(0).toUpperCase();
  placeholder.hidden = true;

  img.addEventListener("error", () => {
    img.hidden = true;
    placeholder.hidden = false;
  });

  skinWrap.appendChild(img);
  skinWrap.appendChild(placeholder);

  const nameEl = document.createElement("h3");
  nameEl.className = "player-card__name";
  nameEl.textContent = profile.name;

  const tagEl = document.createElement("span");
  tagEl.className = "player-card__tag";
  tagEl.textContent = "Player";

  const descEl = document.createElement("p");
  descEl.className = "player-card__desc";
  const uuidFormatted = formatUuid(profile.id);
  descEl.textContent = `UUID: ${truncateMiddle(uuidFormatted, 36)}`;
  descEl.title = uuidFormatted;

  const actions = document.createElement("div");
  actions.className = "player-card__actions";

  const followBtn = document.createElement("button");
  followBtn.type = "button";
  followBtn.className = "btn-primary";
  followBtn.textContent = "Follow";

  const profileBtn = document.createElement("button");
  profileBtn.type = "button";
  profileBtn.className = "btn-secondary";
  profileBtn.textContent = "View profile";

  actions.appendChild(followBtn);
  actions.appendChild(profileBtn);

  card.appendChild(skinWrap);
  card.appendChild(nameEl);
  card.appendChild(tagEl);
  card.appendChild(descEl);
  card.appendChild(actions);

  return card;
}

function setError(payload) {
  let text;
  if (typeof payload === "string") {
    text = payload;
  } else if (payload && typeof payload === "object") {
    if (payload.errorMessage) {
      text = payload.errorMessage;
    } else {
      text = [
        payload.error,
        payload.message,
        payload.preview ? `Preview: ${payload.preview}` : "",
        payload.status != null ? `HTTP ${payload.status}` : ""
      ]
        .filter(Boolean)
        .join(" — ");
    }
  } else {
    text = "Something went wrong.";
  }
  showMessage(text, "error");
}

async function fetchMojangViaProxy(endpointUrl) {
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(endpointUrl)}`,
    `https://corsproxy.io/?${encodeURIComponent(endpointUrl)}`
  ];

  let response;
  let lastError;
  for (const proxyUrl of proxyUrls) {
    try {
      response = await fetch(proxyUrl);
      if (response.ok) break;
    } catch (e) {
      lastError = e;
      response = null;
    }
  }
  return { response, lastError };
}

async function handleSearch(event) {
  event.preventDefault();
  const query = usernameInput.value.trim();

  if (!query) {
    showMessage("Enter a username, UUID, or a URL that includes a player UUID.", "muted");
    return;
  }

  const parsed = parseSearchQuery(query);

  if (parsed.type === "skin_hash_unsupported") {
    showMessage(
      "Mojang has no public API to find a player from a skin texture hash alone. Use a username, a player UUID, or a link that contains a UUID (for example a Crafatar avatar URL).",
      "muted"
    );
    return;
  }

  if (parsed.type === "empty") {
    showMessage("Enter a username, UUID, or a URL that includes a player UUID.", "muted");
    return;
  }

  showMessage("Searching...", "loading");

  try {
    let endpointUrl;
    if (parsed.type === "uuid") {
      endpointUrl = `https://sessionserver.mojang.com/session/minecraft/profile/${encodeURIComponent(parsed.id)}`;
    } else {
      endpointUrl = `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(parsed.name)}`;
    }

    const { response, lastError } = await fetchMojangViaProxy(endpointUrl);

    if (!response || !response.ok) {
      setError({
        error: "Proxy request failed (Mojang cannot be called directly from the browser due to CORS).",
        status: response?.status,
        message: lastError instanceof Error ? lastError.message : String(lastError ?? "")
      });
      return;
    }

    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      setError({
        error: "Could not read response",
        preview: text.slice(0, 200)
      });
      return;
    }

    if (isProfileSuccess(data)) {
      clearResults();
      searchResults.appendChild(renderPlayerCard(normalizeProfileForCard(data)));
      return;
    }

    if (data && typeof data === "object" && data.errorMessage) {
      setError(data);
      return;
    }

    setError({
      error: "Unexpected response",
      preview: typeof data === "object" ? JSON.stringify(data).slice(0, 200) : String(data)
    });
  } catch (error) {
    setError({
      error: "Network error while contacting Mojang (via proxy).",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function showEmptyState() {
  showMessage("Enter a username, UUID, or skin/image URL that contains a UUID, then click Go.", "muted");
}

searchForm.addEventListener("submit", handleSearch);
showEmptyState();
