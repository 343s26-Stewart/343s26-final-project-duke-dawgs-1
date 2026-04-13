/* BlockTag localStorage helper — exposes window.Store */
const Store = (function () {
  const KEYS = {
    following: "blocktag_following",
    profile: "blocktag_profile",
    posts: "blocktag_posts",
    groups: "blocktag_groups"
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ---- Following ---- */
  function getFollowing() {
    return read(KEYS.following, []);
  }

  function isFollowing(playerId) {
    return getFollowing().some(function (p) { return p.id === playerId; });
  }

  function addFollowing(player) {
    const list = getFollowing();
    if (list.some(function (p) { return p.id === player.id; })) return list;
    list.push({ name: player.name, id: player.id });
    write(KEYS.following, list);
    return list;
  }

  function removeFollowing(playerId) {
    const list = getFollowing().filter(function (p) { return p.id !== playerId; });
    write(KEYS.following, list);
    return list;
  }

  /* ---- Profile ---- */
  function getProfile() {
    return read(KEYS.profile, {
      description: "",
      tags: [],
      links: []
    });
  }

  function saveProfile(profile) {
    write(KEYS.profile, profile);
  }

  /* ---- Posts ---- */
  function getPosts() {
    return read(KEYS.posts, []);
  }

  function addPost(post) {
    const list = getPosts();
    post.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    post.createdAt = new Date().toISOString();
    list.unshift(post);
    write(KEYS.posts, list);
    return list;
  }

  function deletePost(postId) {
    const list = getPosts().filter(function (p) { return p.id !== postId; });
    write(KEYS.posts, list);
    return list;
  }

  function toggleInterest(postId, playerName) {
    const list = getPosts();
    const post = list.find(function (p) { return p.id === postId; });
    if (!post) return list;
    if (!post.interested) post.interested = [];
    const idx = post.interested.indexOf(playerName);
    if (idx === -1) {
      post.interested.push(playerName);
    } else {
      post.interested.splice(idx, 1);
    }
    write(KEYS.posts, list);
    return list;
  }

  /* ---- Groups ---- */
  function getGroups() {
    return read(KEYS.groups, []);
  }

  function addGroup(group) {
    const list = getGroups();
    group.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    group.members = group.members || [];
    list.push(group);
    write(KEYS.groups, list);
    return list;
  }

  function deleteGroup(groupId) {
    const list = getGroups().filter(function (g) { return g.id !== groupId; });
    write(KEYS.groups, list);
    return list;
  }

  function joinGroup(groupId, playerName) {
    const list = getGroups();
    const group = list.find(function (g) { return g.id === groupId; });
    if (!group) return list;
    if (!group.members.includes(playerName)) {
      group.members.push(playerName);
    }
    write(KEYS.groups, list);
    return list;
  }

  function leaveGroup(groupId, playerName) {
    const list = getGroups();
    const group = list.find(function (g) { return g.id === groupId; });
    if (!group) return list;
    group.members = group.members.filter(function (m) { return m !== playerName; });
    write(KEYS.groups, list);
    return list;
  }

  /* ---- Export / Import ---- */
  function exportAll() {
    return JSON.stringify({
      following: getFollowing(),
      profile: getProfile(),
      posts: getPosts(),
      groups: getGroups()
    }, null, 2);
  }

  function importAll(jsonString) {
    const data = JSON.parse(jsonString);
    if (data.following) write(KEYS.following, data.following);
    if (data.profile) write(KEYS.profile, data.profile);
    if (data.posts) write(KEYS.posts, data.posts);
    if (data.groups) write(KEYS.groups, data.groups);
  }

  return {
    getFollowing: getFollowing,
    isFollowing: isFollowing,
    addFollowing: addFollowing,
    removeFollowing: removeFollowing,
    getProfile: getProfile,
    saveProfile: saveProfile,
    getPosts: getPosts,
    addPost: addPost,
    deletePost: deletePost,
    toggleInterest: toggleInterest,
    getGroups: getGroups,
    addGroup: addGroup,
    deleteGroup: deleteGroup,
    joinGroup: joinGroup,
    leaveGroup: leaveGroup,
    exportAll: exportAll,
    importAll: importAll
  };
})();
