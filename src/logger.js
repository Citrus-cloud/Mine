// Модуль логирования ClickFlow

let logCounter = 0;

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getLogLabel(type) {
  switch (type) {
    case 'info': return 'ℹ️';
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '•';
  }
}

function createLog(type, message) {
  logCounter++;
  return {
    id: `log-${Date.now()}-${logCounter}`,
    time: formatTime(new Date()),
    type: type,
    message: message
  };
}
