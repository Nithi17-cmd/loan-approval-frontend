export function getErrorMessage(error, fallbackMessage = 'Something went wrong. Please try again.') {
  if (!error) {
    return fallbackMessage;
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === 'object') {
    const message = data.message || data.error || data.detail || data.title;
    if (message && typeof message === 'string' && message.trim()) {
      return message.trim();
    }

    const validationErrors = data.errors || data.validationErrors || data.fieldErrors;
    if (validationErrors && typeof validationErrors === 'object') {
      const values = Object.values(validationErrors)
        .flatMap((entry) => {
          if (Array.isArray(entry)) {
            return entry;
          }
          if (typeof entry === 'string') {
            return [entry];
          }
          return [];
        })
        .filter((entry) => typeof entry === 'string' && entry.trim())
        .map((entry) => entry.trim());

      if (values.length > 0) {
        return values[0];
      }
    }
  }

  if (status === 400) {
    return 'Please review the form and try again.';
  }

  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'The requested resource was not found.';
  }

  if (status === 409) {
    return 'This application has already been processed.';
  }

  if (error.request) {
    return 'The server is not responding. Please check that the backend is running on port 8080.';
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
}
