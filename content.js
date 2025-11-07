(() => {
  console.log('started.');
  // ---- config ----
  const OVERLAY_IMG = chrome.runtime.getURL("overlay.png"); // 差し替え可
  const OVERLAY_OPACITY = 0.95;
  const EXTENSION_LOG_PREFIX = '[YANS] ';
  let overlayEl = null;
  let observing = false;
  let skipTimer = null;
  let navBound = false;

  // ミュート制御でユーザー設定を壊さない
  let weMuted = false;
  let prevMuted = null;

  function getPlayer() {
    // YouTubeのプレイヤーコンテナ
    return document.getElementById("movie_player") || document.querySelector("ytd-player");
  }

  function getVideoEl() {
    return document.querySelector("video.html5-main-video") || document.querySelector("video");
  }

  function isAdShowing() {
    // YouTubeは広告中に #movie_player に ad-showing クラスを付与
    // 参考: プレイヤー要素のclassNameに "ad-showing" が含まれる
    const p = getPlayer();
    return p && p.classList.contains("ad-showing");
  }

  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    const p = getPlayer();
    if (!p) return null;

    overlayEl = document.createElement("div");
    overlayEl.style.position = "absolute";
    overlayEl.style.inset = "0";
    overlayEl.style.display = "none";
    overlayEl.style.zIndex = "9999";
    overlayEl.style.pointerEvents = "none"; // SkipクリックなどのUIを邪魔しない
    overlayEl.style.background = `rgba(0,0,0,0) center center / contain no-repeat`;
    const img = document.createElement("img");
    img.id = 'ad_overlay_img';
    img.src = OVERLAY_IMG;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "100%";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.opacity = String(OVERLAY_OPACITY);
    overlayEl.appendChild(img);
    console.log(EXTENSION_LOG_PREFIX+'img overlayed');
    // プレイヤーの相対配置を保証
    const host = p.querySelector(".html5-video-container") || p;
    const hostStyle = getComputedStyle(host);
    if (hostStyle.position === "static") host.style.position = "relative";
    host.appendChild(overlayEl);
    return overlayEl;
  }

  function showOverlay(show) {
    const el = ensureOverlay();
    if (!el) return;
    el.style.display = show ? "block" : "none";
  }

  function muteForAd(active) {
    const v = getVideoEl();
    if (!v) return;
    if (active) {
      if (prevMuted === null) prevMuted = v.muted;
      if (!v.muted) {
        v.muted = true;
        weMuted = true;
      }
    } else {
      // 広告が終わったら、こちらがミュートした場合のみ元に戻す
      if (weMuted && prevMuted !== null) {
        v.muted = prevMuted;
      }
      prevMuted = null;
      weMuted = false;
    }
  }

  function isClickable(el) {
    console.log(EXTENSION_LOG_PREFIX+'Checking if clickable...');
    if (!el || !el.isConnected) {
      console.log(EXTENSION_LOG_PREFIX+'Skip not clickable 1');
      return false;
    }
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility !== "visible") {
      console.log(EXTENSION_LOG_PREFIX+'Skip not clickable 2');
      return false
    };
    if (el.disabled || el.getAttribute("aria-disabled") === "true") {
      console.log(EXTENSION_LOG_PREFIX+'Skip not clickable 3');
      return false;
    }
    const r = el.getBoundingClientRect();
    console.log(EXTENSION_LOG_PREFIX+'Skip Clickable.');
    return r.width > 0 && r.height > 0;
  }

  function findSkipBtn() {
    //console.log(EXTENSION_LOG_PREFIX+'Looking fir skip button....');
    const root = getPlayer() || document;
    const selectors = [
      "button.ytp-skip-ad-button",         // 例: あなたのHTML
      "button.ytp-ad-skip-button",         // 旧UI
      ".ytp-ad-skip-button-modern",        // 新UI
      "button.ytp-ad-overlay-close-button" // オーバーレイクローズ
    ];
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (isClickable(el)) {
        //console.log(EXTENSION_LOG_PREFIX+'skip button detected.');
        return el;
      }
    }
    return null;
  }

  function clickSkipIfAny() {
    if (!isAdShowing()) return;
    const btn = findSkipBtn();
    if (!btn) return;

    //isTrusted Checker.
    btn.addEventListener("click", (e) => {
      console.log(EXTENSION_LOG_PREFIX+'isTrusted:'+e.isTrusted);
    });

    // 実クリック相当のイベント列
    console.log(EXTENSION_LOG_PREFIX+'Clicking Skip button.');
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
      console.log(EXTENSION_LOG_PREFIX+'Falling back to DOM click');
      btn.click();
    }
  }

  function startSkipWatcher() {
    if (skipTimer) return;
    // 軽量ループ。500ms間隔でSkip存在チェック
    skipTimer = setInterval(clickSkipIfAny, 500);
  }

  function stopSkipWatcher() {
    if (skipTimer) {
      clearInterval(skipTimer);
      skipTimer = null;
    }
  }

  function handleAdState() {
    const inAd = isAdShowing();
    muteForAd(inAd);
    showOverlay(inAd);
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
    // SPA遷移に対応
    // ページ切替後に要素が入れ替わるので再セット
    overlayEl = null;
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
    // YouTube SPAナビゲーションイベント
    window.addEventListener("yt-navigate-finish", onNavigated);
    // 万一の保険
    window.addEventListener("popstate", onNavigated);
    window.addEventListener("yt-navigate-start", onNavigated);
  }

  function boot() {
    bindYtNav();
    attachMutationObserver();
    // 初期判定
    handleAdState();
    // 予備: DOM安定後にもう一度
    setTimeout(handleAdState, 1500);
  }

  // DOM準備
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
