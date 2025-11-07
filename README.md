https://buymeacoffee.com/luis8492

# Youtube-Ad-Non-Skipper
A chrome extension. Instead of skipping/blocking the advertisement, it mutes the ad and show a cute img/movie over the ad.

## Overlay image

The overlay graphic (`overlay.png`) is bundled with the extension and is exposed via `chrome.runtime.getURL`. If you replace the image, keep the file name or update `content.js`, and ensure the asset remains listed under `web_accessible_resources` in `manifest.json` so the content script can load it at runtime.
