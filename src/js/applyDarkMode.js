(function() {
    if (Store.getSettings()["dark-mode"]) {
        console.log("dark");
        let root = document.querySelector(":root");
        root.classList.add("dark-mode");
        // document.documentElement.style.setProperty('--card-bg', 'black');
    }
})();