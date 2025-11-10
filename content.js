(() => {
  // ---- config ----
  const EXTENSION_LOG_PREFIX = '[YANS] ';
  let observing = false;
  let skipTimer = null;
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
  
  //Not Working Zone Start---------------------------------------------------------------
  function isClickable(el) {
    if (!el || !el.isConnected) {
      return false;
    }
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility !== "visible") {
      return false
    };
    if (el.disabled || el.getAttribute("aria-disabled") === "true") {
      return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function findSkipBtn() {
    const root = getPlayer() || document;
    const selectors = [
      "button.ytp-skip-ad-button",
      "button.ytp-ad-skip-button",
      ".ytp-ad-skip-button-modern",
      "button.ytp-ad-overlay-close-button"
    ];
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (isClickable(el)) {
        return el;
      }
    }
    return null;
  }

  function clickSkipIfAny() {
    //Not Working
    if (!isAdShowing()) return;
    const btn = findSkipBtn();
    if (!btn) return;

    //isTrusted Checker.
    btn.addEventListener("click", (e) => {
      console.log(EXTENSION_LOG_PREFIX+'isTrusted:'+e.isTrusted);
    });

    //click-ish. I cannnot make it to "isTrusted=true".
    const rect = btn.getBoundingClientRect();
    const clientX = rect.left + rect.width / 2;
    const clientY = rect.top + rect.height / 2;
    const baseOpts = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY,
      screenX: window.screenX + clientX,
      screenY: window.screenY + clientY
    };

    if (typeof PointerEvent === "function") {
      const pointerOpts = {
        ...baseOpts,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true
      };
      btn.dispatchEvent(new PointerEvent("pointerover", {
        ...pointerOpts,
        button: -1,
        buttons: 0,
        detail: 0
      }));
      btn.dispatchEvent(new PointerEvent("pointerenter", {
        ...pointerOpts,
        button: -1,
        buttons: 0,
        detail: 0
      }));
      btn.dispatchEvent(new PointerEvent("pointerdown", {
        ...pointerOpts,
        button: 0,
        buttons: 1,
        detail: 1
      }));
      btn.dispatchEvent(new PointerEvent("pointerup", {
        ...pointerOpts,
        button: 0,
        buttons: 0,
        detail: 0
      }));
    }

    const mouseOver = new MouseEvent("mouseover", {
      ...baseOpts,
      button: 0,
      buttons: 0,
      detail: 0
    });
    const mouseDown = new MouseEvent("mousedown", {
      ...baseOpts,
      button: 0,
      buttons: 1,
      detail: 1
    });
    const mouseUp = new MouseEvent("mouseup", {
      ...baseOpts,
      button: 0,
      buttons: 0,
      detail: 0
    });
    const mouseClick = new MouseEvent("click", {
      ...baseOpts,
      button: 0,
      buttons: 0,
      detail: 1
    });
    btn.dispatchEvent(mouseOver);
    btn.dispatchEvent(mouseDown);
    btn.dispatchEvent(mouseUp);
    if (
      mouseClick.defaultPrevented ||
      !btn.dispatchEvent(mouseClick)
    ) {
      // fall back to DOM click if the synthesized click was prevented
      btn.click();
    }
  }
  
  function startSkipWatcher() {
    if (skipTimer) return;
    skipTimer = setInterval(clickSkipIfAny, 500);
  }

  function stopSkipWatcher() {
    if (skipTimer) {
      clearInterval(skipTimer);
      skipTimer = null;
    }
  }
  //Not Working Zone End---------------------------------------------------------------
  
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
  
  function disableAd(inAd) {
    muteForAd(inAd);
    hideAd(inAd);
  }

  function handleAdState() {
    const inAd = isAdShowing();
    disableAd(inAd);
    if (inAd) startSkipWatcher();
    else stopSkipWatcher();
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
    stopSkipWatcher();
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


