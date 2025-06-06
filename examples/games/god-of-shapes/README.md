# ShapesGod

ShapesGod is an interactive web application where you can combine elemental emojis to discover new elements, inspired by games like Infinite Craft. Mix, connect, and experiment with emojis to see what creative fusions you can unlock!

---

## 🚀 Features

- 🧩 **Drag and drop** elemental emojis onto a canvas
- 🔗 **Connect elements** to create new fusions
- ✨ **Discover and collect** unique emoji combinations
- 🗃️ **Undo/redo** your actions on the canvas
- 🔒 **Authentication** for personalized sessions

---
## 🔮 AI-Powered Fusion Engine
ShapesGod uses the Shapes API to generate new elemental fusions dynamically. When you combine two emojis, the app sends them to the shapesinc/elementcreatorv2 model, which returns:

A creative fusion name (e.g., combining "fire" and "water" might yield "steam")

A single emoji that represents the fusion

This approach allows for endless, imaginative combinations without relying on a predefined list. It keeps the gameplay fresh and encourages exploration.

### 🌟 Why Use the Shapes API?

- **Dynamic Fusion Generation:**  
    No static lists—every combination is generated in real time, making each discovery unique and interactive.

- **Effortless Scalability:**  
    The system automatically supports new emoji combinations as users experiment, with no manual updates required.

- **Enhanced User Engagement:**  
    The surprise of novel fusions keeps gameplay fresh and encourages creative exploration.
## 🛠️ Getting Started

1. **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    # or
    bun install
    ```

2. **Set up environment variables:**

    Copy the example environment file and update values as needed:

    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local` to configure your environment variables.

3. **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    # or
    bun dev
    ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment

Deploy easily on [Vercel](https://vercel.com/) or any platform supporting Next.js.  
See the [Next.js deployment docs](https://nextjs.org/docs/deployment) for more information.

---

## 📄 License

[MIT](LICENSE)

---

Made with ❤️ using [Next.js](https://nextjs.org/)