const api = typeof browser !== "undefined" ? browser : chrome;

const toggle = document.getElementById("enabled");
const status = document.getElementById("status");

api.storage.local
  .get({ enabled: true })
  .then(({ enabled }) => {
    toggle.checked = enabled !== false;
    updateStatus();
  })
  .catch(() => {
    toggle.checked = true;
    updateStatus();
  });

toggle.addEventListener("change", () => {
  api.storage.local.set({ enabled: toggle.checked }).then(updateStatus);
});

function updateStatus() {
  status.textContent = toggle.checked
    ? "On. Open algogym.ru tabs update automatically."
    : "Off. AlgoGym stays AlgoGym.";
}
