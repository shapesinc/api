import ElementalEmojiCreator from "@/components/ElementalEmojiCreator";
import { AuthProvider } from "@/components/AuthProvider";

export default function Home() {
  return (
    <main className="min-h-screen">
      <AuthProvider>
        <ElementalEmojiCreator />
      </AuthProvider>
    </main>
  );
}