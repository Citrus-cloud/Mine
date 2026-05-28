// Менеджер сценариев ClickFlow

const defaultScenarios = [
  {
    id: "basic-clicker",
    name: "Быстрый кликер",
    type: "simple_click",
    description: "Базовый сценарий для будущих кликов по координатам",
    settings: {
      x: 500,
      y: 400,
      intervalMs: 500,
      repeatCount: 100,
      button: "left"
    }
  }
];

function getScenarios() {
  return [...defaultScenarios];
}

function getScenarioById(id) {
  return defaultScenarios.find(s => s.id === id) || null;
}

function getDefaultScenario() {
  return defaultScenarios[0];
}
