(function () {
  const profileForm = document.getElementById("profile-form");
  const followingList = document.getElementById("following-list");
  const profileMsg = document.getElementById("profile-msg");
  const avatarInput = document.getElementById("profile-avatar");
  const avatarPreview = document.getElementById("profile-avatar-preview");

  function loadProfile() {
    const profile = Store.getProfile();
    document.getElementById("profile-desc").value = profile.description || "";
    document.getElementById("profile-discord").value = (profile.links && profile.links[0]) || "";
    document.getElementById("profile-youtube").value = (profile.links && profile.links[1]) || "";

    if (profile.avatar) {
      avatarPreview.src = profile.avatar;
      avatarPreview.style.display = "block";
    } else {
      avatarPreview.removeAttribute("src");
      avatarPreview.style.display = "none";
    }

    const tags = profile.tags || [];
    document.querySelectorAll('#profile-tags input[type="checkbox"]').forEach(function (cb) {
      cb.checked = tags.includes(cb.value);
    });
  }

  function renderFollowing() {
    followingList.innerHTML = "";
    const list = Store.getFollowing();

    if (list.length === 0) {
      const p = document.createElement("p");
      p.className = "results-message results-message--muted";
      p.textContent = "You aren't following anyone yet. Head to Discover to find players!";
      followingList.appendChild(p);
      return;
    }

    list.forEach(function (player) {
      const card = document.createElement("div");
      card.className = "following-card";
      card.setAttribute("role", "listitem");

      const skinImg = document.createElement("img");
      skinImg.className = "following-card__skin";
      skinImg.alt = "Skin for " + player.name;
      skinImg.loading = "lazy";
      skinImg.src = "https://mc-heads.net/avatar/" + encodeURIComponent(player.id) + "/48";

      const name = document.createElement("span");
      name.className = "following-card__name";
      name.textContent = player.name;

      const unfollowBtn = document.createElement("button");
      unfollowBtn.type = "button";
      unfollowBtn.className = "btn-danger";
      unfollowBtn.textContent = "Unfollow";
      unfollowBtn.addEventListener("click", function () {
        Store.removeFollowing(player.id);
        renderFollowing();
      });

      card.appendChild(skinImg);
      card.appendChild(name);
      card.appendChild(unfollowBtn);
      followingList.appendChild(card);
    });
  }

  avatarInput.addEventListener("change", function () {
    const file = avatarInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      avatarPreview.src = e.target.result;
      avatarPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  profileForm.addEventListener("submit", function (e) {
    e.preventDefault();
    profileMsg.textContent = "";

    const tags = [];
    document.querySelectorAll('#profile-tags input[type="checkbox"]:checked').forEach(function (cb) {
      tags.push(cb.value);
    });

    const discord = document.getElementById("profile-discord").value.trim();
    const youtube = document.getElementById("profile-youtube").value.trim();

    Store.saveProfile({
      description: document.getElementById("profile-desc").value.trim(),
      tags: tags,
      links: [discord, youtube],
      avatar: avatarPreview.src || ""
    });

    profileMsg.textContent = "Profile saved!";
  });

  loadProfile();
  renderFollowing();
})();
