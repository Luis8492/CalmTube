(() => {
  // ---- config ----
  let observing = false;
  let navBound = false;

  // User mute setting holder
  let weMuted = false;
  let prevMuted = null;
  let prevDisplay = null;

  function getPlayer() {
    return document.getElementById("movie_player") || document.querySelector("ytd-player");
  }

  function getVideoEl() {
    return document.querySelector("video.html5-main-video") || document.querySelector("video");
  }

  function isAdShowing() {
    const p = getPlayer();
    return p && p.classList.contains("ad-showing");
  }
  
  function muteForAd(active) {
    const v = getVideoEl();
    if (!v) return;
    if (active) {
      if (prevMuted === null) {
        prevMuted = v.muted;
      }
      if (!v.muted) {
        v.muted = true;
        weMuted = true;
      }
    } else {
      if (weMuted && prevMuted !== null) {
        v.muted = prevMuted;
      }
      prevMuted = null;
      weMuted = false;
    }
  }
  
  function hideAd(active){
    const v = getVideoEl();
    if (!v) return;
    if (active) {
      if (prevDisplay === null) {
        prevDisplay = v.style.display;
      }
      v.style.display = 'none';
    } else {
      v.style.display = prevDisplay;
      prevDisplay = null;
    }
  }
  
  function handleAdState() {
    const inAd = isAdShowing();
    muteForAd(inAd);
    hideAd(inAd);
  }

  function attachMutationObserver() {
    if (observing) return;
    const p = getPlayer() || document.body;
    if (!p) return;
    const obs = new MutationObserver(handleAdState);
    obs.observe(p, { attributes: true, subtree: true, attributeFilter: ["class"] });
    observing = true;
  }

  function onNavigated() {
    // catch SPA transition
    observing = false;
    //stopSkipWatcher();
    setTimeout(() => {
      attachMutationObserver();
      handleAdState();
    }, 800);
  }

  function bindYtNav() {
    if (navBound) return;
    navBound = true;
    window.addEventListener("yt-navigate-finish", onNavigated);
    window.addEventListener("popstate", onNavigated);
    window.addEventListener("yt-navigate-start", onNavigated);
  }

  function boot() {
    bindYtNav();
    attachMutationObserver();
    handleAdState();
    // just in case.
    setTimeout(handleAdState, 1500);
  }
  
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();


