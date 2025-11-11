// Debug helper for auth flow
let debugEnabled = true;

export const debugLog = (step, data) => {
  if (!debugEnabled) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[Auth Debug ${timestamp}]`;
  
  console.log(prefix, step);
  if (data) {
    console.log(prefix, 'Data:', data);
  }
};

export const enableAuthDebug = (enabled = true) => {
  debugEnabled = enabled;
};