(function () {
  const postForm = document.getElementById("post-form");
  const feedList = document.getElementById("feed-list");
  const sortSelect = document.getElementById("sort-select");
  const formMsg = document.getElementById("post-form-msg");

  function getCheckedTags() {
    const boxes = document.querySelectorAll('#post-tags input[type="checkbox"]:checked');
    return Array.from(boxes).map(function (cb) { return cb.value; });
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  }

  function renderPost(post) {
    const article = document.createElement("article");
    article.className = "feed-post";
    article.setAttribute("role", "listitem");

    const header = document.createElement("div");
    header.className = "feed-post__header";

    const author = document.createElement("h3");
    author.className = "feed-post__author";
    author.textContent = post.author;

    const time = document.createElement("span");
    time.className = "feed-post__time";
    time.textContent = timeAgo(post.createdAt);

    header.appendChild(author);
    header.appendChild(time);

    const desc = document.createElement("p");
    desc.className = "feed-post__desc";
    desc.textContent = post.description;

    const tagsWrap = document.createElement("div");
    tagsWrap.className = "feed-post__tags";
    (post.tags || []).forEach(function (tag) {
      const span = document.createElement("span");
      span.className = "player-card__tag";
      span.textContent = tag;
      tagsWrap.appendChild(span);
    });

    const interested = post.interested || [];
    const interestSection = document.createElement("div");
    interestSection.className = "feed-post__interest";

    const interestBtn = document.createElement("button");
    interestBtn.type = "button";
    interestBtn.className = "btn-secondary";
    interestBtn.textContent = "I'm interested (" + interested.length + ")";
    interestBtn.addEventListener("click", function () {
      const name = prompt("Enter your Minecraft username:");
      if (name && name.trim()) {
        Store.toggleInterest(post.id, name.trim());
        renderFeed();
      }
    });

    interestSection.appendChild(interestBtn);

    if (interested.length > 0) {
      const names = document.createElement("p");
      names.className = "feed-post__names";
      names.textContent = "Interested: " + interested.join(", ");
      interestSection.appendChild(names);
    }

    const actions = document.createElement("div");
    actions.className = "feed-post__actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", function () {
      Store.deletePost(post.id);
      renderFeed();
    });
    actions.appendChild(deleteBtn);

    article.appendChild(header);
    article.appendChild(desc);
    article.appendChild(tagsWrap);
    article.appendChild(interestSection);
    article.appendChild(actions);

    return article;
  }

  function renderFeed() {
    feedList.innerHTML = "";
    let posts = Store.getPosts();

    if (sortSelect.value === "interested") {
      posts.sort(function (a, b) {
        return (b.interested || []).length - (a.interested || []).length;
      });
    }

    if (posts.length === 0) {
      const p = document.createElement("p");
      p.className = "results-message results-message--muted";
      p.textContent = "No posts yet. Create one above!";
      feedList.appendChild(p);
      return;
    }

    posts.forEach(function (post) {
      feedList.appendChild(renderPost(post));
    });
  }

  postForm.addEventListener("submit", function (e) {
    e.preventDefault();
    formMsg.textContent = "";

    const author = document.getElementById("post-author").value.trim();
    const description = document.getElementById("post-desc").value.trim();
    const tags = getCheckedTags();

    if (!author) {
      formMsg.textContent = "Please enter your Minecraft username.";
      return;
    }
    if (!description) {
      formMsg.textContent = "Please enter a description.";
      return;
    }

    Store.addPost({
      author: author,
      description: description,
      tags: tags,
      interested: []
    });

    postForm.reset();
    formMsg.textContent = "Post created!";
    renderFeed();
  });

  sortSelect.addEventListener("change", renderFeed);

  renderFeed();
})();
