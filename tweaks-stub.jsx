// tweaks-stub.jsx — production stub for useTweaks
// Replaces the dev-mode editor protocol with simple localStorage persistence.
// Same interface so app.jsx works unchanged.

function useTweaks(defaults) {
  const STORAGE_KEY = 'af-sales-tweaks';

  const [values, setValues] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch (e) { /* ignore */ }
    return defaults;
  });

  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => {
      const next = { ...prev, ...edits };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  return [values, setTweak];
}
