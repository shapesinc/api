

# shape interviewer

[![demo](https://img.shields.io/badge/demo-live-blue)](https://shapeinterview.vercel.app/)
[![made with ❤️ by shapes](https://img.shields.io/badge/made%20with%20❤️%20by-shapes-purple)](https://shapes.inc)

**shape interviewer** is an ai-powered platform for practicing interviews using the [shapes api](https://shapes.inc). it simulates realistic, sometimes uncomfortably honest, interview scenarios and gives feedback to help you get better.

## 🌐 live demo

👉 https://shapeinterview.vercel.app/

## 🚀 features

- technical, behavioral, and leadership interviews
- difficulty scaling (like a boss battle)
- text + voice support
- markdown-enabled answers
- custom interview creation
- ai feedback tuned to your responses
- dark/light mode
- responsive layout

## 🧠 how it works

- shapes from the shapes api simulate different interviewer types
- you chat via text or talk out loud
- for voice: audio → [vercel blob](https://vercel.com/blog/vercel-blob) → transcript → ai judgment

## 🔒 privacy

- voice uploads are temp-only
- no sharing/selling of data
- no shady analytics

---

## 🛠️ local dev setup

```bash
git clone [url here]
cd shape-interview
npm install
npm run dev
```
🔑 env config

create a .env file and add:
```
SHAPES_API_KEY=your_shapes_api_key_here

```
get your SHAPES_API_KEY from https://shapes.inc/dev

create blob tokens via vercel cli



---

🧃 enabling vercel blob

1. go to vercel: https://vercel.com

2. choose the project:

3. click storage:

4. choose blob storage:

5. deploy again




---

🧾 license

MIT. do no evil!!! or else...

---
