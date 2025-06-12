## shapekick
a snarky ai browser extension that comments on your browsing with customizable personality, voice, powered by shapes inc

![img](https://i.ibb.co/21pvw3Rf/Screenshot-2025-06-12-143209.png)

### features
draggable avatar with mood-based expressions
witty, context-aware browsing commentary
personality styles: snarky, wholesome, edgy, shy, existential, chaotic
optional voice commentary
adjustable comment frequency and idle detection
interactive replies via text or voice input
tools: open urls, web search, page info, scrolling

### installation

clone or download the repo
go to chrome://extensions/ in chrome
enable "developer mode"
click "load unpacked" and select the project folder
get an api key from https://shapes.inc/developer

### usage

click extension icon for settings
add shapes api key and tweak settings
save to activate sidekick
drag avatar to move it
click avatar for comments
reply with text or voice input
toggle visibility or access settings via control buttons

### files

manifest.json: extension config
popup.html: settings interface
popup.js: settings logic
background.js: background service worker
content.js: core sidekick logic and overlay
overlay.css: avatar and speech bubble styles

### configuration

shapes api key: required for ai features, get at https://shapes.inc/developer
shape username: sets ai model, manage at https://shapes.inc
personality style: pick your vibe
voice comments: toggle voice output
comment frequency: control comment timing
idle detection: set idle comment trigger

### notes

requires valid shapes api key
voice features rely on browser support
comments adapt to page content
supports drag on desktop and touch devices

### license
mit license
