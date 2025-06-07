import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Shape Interviewer",
  description: "Practice interviews with a Shape using Shapes API",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="app-container">
            <header className="app-header">
              <div className="logo">
                <h1>Shape Interviewer</h1>
              </div>
              <nav className="main-nav">
                <ul>
                  <li>
                    <a href="/">Home</a>
                  </li>
                  <li>
                    <a href="/create">Create Interview</a>
                  </li>
                  <li>
                    <a href="/about">About</a>
                  </li>
                  <li>
                    <ThemeToggle />
                  </li>
                </ul>
              </nav>
            </header>
            <main className="app-main">{children}</main>
            <footer className="app-footer">
              <p>
                Powered by{" "}
                <a href="https://shapes.inc" target="_blank" rel="noopener noreferrer">
                  Shapes
                </a>{" "}
                and{" "}
                <a href="https://github.com/shapesinc/api" target="_blank" rel="noopener noreferrer">
                  Shapes API         
                </a>
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
