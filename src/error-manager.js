// Менеджер ошибок ClickFlow

let errorHistory = [];
let errorCounter = 0;

function createAppError(code, message, details) {
  errorCounter++;
  const error = {
    id: 'error-' + Date.now() + '-' + errorCounter,
    time: new Date().toISOString(),
    code: code,
    message: message,
    details: details || {},
    context: ''
  };
  errorHistory.push(error);
  return error;
}

function normalizeError(error, fallbackMessage) {
  if (!error) return { message: fallbackMessage || 'Unknown error' };
  if (typeof error === 'string') return { message: error };
  return { message: error.message || fallbackMessage || 'Unknown error' };
}

function getUserFriendlyError(error) {
  if (!error) return t ? t('noData') : 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message || 'Unknown error';
}

function reportError(error, context) {
  const appError = createAppError(
    error.code || 'UNKNOWN',
    error.message || 'Unknown error',
    error.details || {}
  );
  appError.context = context || '';
  return appError;
}

function getErrorHistory() {
  return [...errorHistory];
}

function clearErrorHistory() {
  errorHistory = [];
}

function getErrorCount() {
  return errorHistory.length;
}
