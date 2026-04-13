(function () {
  /* Stats */
  document.getElementById("stat-following").textContent = Store.getFollowing().length;
  document.getElementById("stat-posts").textContent = Store.getPosts().length;
  document.getElementById("stat-groups").textContent = Store.getGroups().length;

  /* Export */
  document.getElementById("export-btn").addEventListener("click", function () {
    const blob = new Blob([Store.exportAll()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blocktag-data.json";
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById("data-msg").textContent = "Data exported!";
  });

  /* Import */
  document.getElementById("import-input").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        Store.importAll(ev.target.result);
        document.getElementById("data-msg").textContent = "Data imported successfully! Refreshing...";
        setTimeout(function () { location.reload(); }, 800);
      } catch (err) {
        document.getElementById("data-msg").textContent = "Import failed: " + err.message;
      }
    };
    reader.readAsText(file);
  });
})();
