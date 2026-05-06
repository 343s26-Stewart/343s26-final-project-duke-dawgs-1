(function() {
    const darkModeCheck = document.getElementById("dark-mode-check");
    let settings;

    darkModeCheck.addEventListener("click", function() {
        settings["dark-mode"] = darkModeCheck.checked;
        console.log(settings);
        Store.setSettings(settings);
        location.reload();
    });

    function loadSettings() {
        settings = Store.getSettings();
        darkModeCheck.checked = settings["dark-mode"];
    }

    loadSettings();
})();