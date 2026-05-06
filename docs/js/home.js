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

  /* Posts by Tag chart */
  (function () {
    const TAGS = ['Builder', 'Casual', 'PvP', 'Modded', 'Survival', 'Creative', 'Minigames', 'Hardcore'];
    const posts = Store.getPosts();
    const counts = TAGS.map(function (tag) {
      return posts.filter(function (p) { return p.tags && p.tags.includes(tag); }).length;
    });
    const isDark = Store.getSettings()['dark-mode'];
    const textColor = isDark ? '#caa884' : '#3b2d1e';
    const gridColor = isDark ? 'rgba(202,168,132,0.15)' : 'rgba(59,45,30,0.1)';
    new Chart(document.getElementById('tags-chart'), {
      type: 'bar',
      data: {
        labels: TAGS,
        datasets: [{
          label: 'Posts',
          data: counts,
          backgroundColor: 'rgba(93,140,62,0.75)',
          borderColor: '#3f6828',
          borderWidth: 2,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.y + ' post' + (ctx.parsed.y !== 1 ? 's' : ''); } } }
        },
        scales: {
          x: { ticks: { color: textColor, font: { family: 'Minecraft, Arial, sans-serif', size: 10 } }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { stepSize: 1, color: textColor, font: { family: 'Minecraft, Arial, sans-serif', size: 10 } }, grid: { color: gridColor } }
        }
      }
    });
  }());

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
