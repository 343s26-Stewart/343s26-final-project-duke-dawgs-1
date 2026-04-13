(function () {
  const profileForm = document.getElementById("profile-form");
  const followingList = document.getElementById("following-list");
  const profileMsg = document.getElementById("profile-msg");

  function loadProfile() {
    const profile = Store.getProfile();
    document.getElementById("profile-desc").value = profile.description || "";
    document.getElementById("profile-discord").value = (profile.links && profile.links[0]) || "";
    document.getElementById("profile-youtube").value = (profile.links && profile.links[1]) || "";

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
      skinImg.src = "https://crafatar.com/avatars/" + encodeURIComponent(player.id) + "?size=48&overlay";

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
      links: [discord, youtube]
    });

    profileMsg.textContent = "Profile saved!";
  });

  loadProfile();
  renderFollowing();
})();
