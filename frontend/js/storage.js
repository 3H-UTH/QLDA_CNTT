// storage.js - Local storage utilities for the rental app
// Note: This is now mainly for utility functions. Use api.js for session management.

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
}

function getFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from storage:', error);
    return null;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from storage:', error);
    return false;
  }
}

function clearStorage() {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
}

// Legacy functions - use api.getSession() and api.clearSession() instead
function saveUserSession(user) {
  console.warn('saveUserSession is deprecated, use api client instead');
  return saveToStorage('currentUser', user);
}

function getUserSession() {
  console.warn('getUserSession is deprecated, use api.getSession() instead');
  return getFromStorage('currentUser');
}

function clearUserSession() {
  console.warn('clearUserSession is deprecated, use api.clearSession() instead');
  return removeFromStorage('currentUser');
}

// Search filters - still useful for UI state
function saveSearchFilters(filters) {
  return saveToStorage('searchFilters', filters);
}

function getSearchFilters() {
  return getFromStorage('searchFilters') || {};
}

// App preferences
function saveAppPreferences(prefs) {
  return saveToStorage('appPreferences', prefs);
}

function getAppPreferences() {
  return getFromStorage('appPreferences') || {
    theme: 'light',
    language: 'vi',
    currency: 'VND'
  };
}
