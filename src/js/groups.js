(function () {
  const groupForm = document.getElementById("group-form");
  const groupsList = document.getElementById("groups-list");
  const formMsg = document.getElementById("group-form-msg");

  function renderGroups() {
    groupsList.innerHTML = "";
    const groups = Store.getGroups();

    if (groups.length === 0) {
      const p = document.createElement("p");
      p.className = "results-message results-message--muted";
      p.textContent = "No groups yet. Create one above!";
      groupsList.appendChild(p);
      return;
    }

    groups.forEach(function (group) {
      const card = document.createElement("article");
      card.className = "group-card";
      card.setAttribute("role", "listitem");

      const name = document.createElement("h3");
      name.className = "group-card__name";
      name.textContent = group.name;

      const members = document.createElement("p");
      members.className = "group-card__members";
      const memberList = group.members || [];
      members.textContent = memberList.length === 0
        ? "No members yet"
        : "Members: " + memberList.join(", ");

      const actions = document.createElement("div");
      actions.className = "group-card__actions";

      const joinBtn = document.createElement("button");
      joinBtn.type = "button";
      joinBtn.className = "btn-primary";
      joinBtn.textContent = "Join";
      joinBtn.addEventListener("click", function () {
        const playerName = prompt("Enter your Minecraft username:");
        if (playerName && playerName.trim()) {
          Store.joinGroup(group.id, playerName.trim());
          renderGroups();
        }
      });

      const leaveBtn = document.createElement("button");
      leaveBtn.type = "button";
      leaveBtn.className = "btn-secondary";
      leaveBtn.textContent = "Leave";
      leaveBtn.addEventListener("click", function () {
        const playerName = prompt("Enter your Minecraft username:");
        if (playerName && playerName.trim()) {
          Store.leaveGroup(group.id, playerName.trim());
          renderGroups();
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        Store.deleteGroup(group.id);
        renderGroups();
      });

      actions.appendChild(joinBtn);
      actions.appendChild(leaveBtn);
      actions.appendChild(deleteBtn);

      card.appendChild(name);
      card.appendChild(members);
      card.appendChild(actions);
      groupsList.appendChild(card);
    });
  }

  groupForm.addEventListener("submit", function (e) {
    e.preventDefault();
    formMsg.textContent = "";

    const name = document.getElementById("group-name").value.trim();
    const creator = document.getElementById("group-your-name").value.trim();

    if (!name) {
      formMsg.textContent = "Please enter a group name.";
      return;
    }
    if (!creator) {
      formMsg.textContent = "Please enter your Minecraft username.";
      return;
    }

    Store.addGroup({
      name: name,
      members: [creator]
    });

    groupForm.reset();
    formMsg.textContent = "Group created!";
    renderGroups();
  });

  renderGroups();
})();
