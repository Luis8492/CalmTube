https://buymeacoffee.com/luis8492

# Youtube-Ad-Non-Skipper

Youtube-Ad-Non-Skipper is a Chrome extension designed to make YouTube ads less intrusive without violating platform policies. Instead of blocking or auto-skipping advertisements, the extension focuses on muting ad audio and preparing an unobtrusive visual cover so you can stay focused until the content resumes.

## Features

- **Automatic ad detection** – Monitors YouTube playback events to recognise when an advertisement starts.
- **Ad muting** – Silences the video element during ad playback to avoid disruptive audio.
- **Automatic restoration** – Restores the original audio level once the advertisement ends.

## Planned Enhancements

- **Visual overlay refresh** – Resolve the current issue that prevents the bundled image overlay from appearing and ship a polished default artwork experience.
- **Custom overlay selector** – Allow users to pick from multiple bundled overlays or provide their own image.
- **Notification preferences** – Provide options for subtle toast notifications when ads start and finish.
- **Playback analytics** – Offer a lightweight summary of muted ads to help users understand how often ads appear.

## Overlay Image

The overlay graphic (`overlay.png`) is bundled with the extension and is exposed via `chrome.runtime.getURL`. A loading issue in the current build prevents the asset from displaying, and restoring the behaviour is part of the roadmap above. If you experiment with fixes locally, keep the file name or update `content.js`, and ensure the asset remains listed under `web_accessible_resources` in `manifest.json` so the content script can load it at runtime.
