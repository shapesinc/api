"use client"

import { useState, useEffect, useRef } from "react"

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
  </div>
)

export default function ChefChatPage() {
  const [selectedChef, setSelectedChef] = useState("")
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }

    if (selectedChef && !isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatHistory, isLoading, selectedChef])

  const handleChefSelection = (chef) => {
    setSelectedChef(chef)
    setChatHistory([])
    setError("")
    setMessage("")

    if (chef === "vikas") {
      setChatHistory([
        {
          sender: "Vikas",
          text: "Namaste! It's wonderful to have you here. How can I help you in the kitchen today? 😊",
        },
      ])
    } else if (chef === "gordon") {
      setChatHistory([
        {
          sender: "Gordon",
          text: "Alright, let's not waste time. What culinary disaster are you dealing with now? Or are you actually going to impress me?",
        },
      ])
    }

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || !selectedChef) return

    const userMessage = { sender: "User", text: message }
    setChatHistory((prev) => [...prev, userMessage])
    const currentMessageToSubmit = message
    setMessage("")
    setIsLoading(true)
    setError("")

    const apiEndpoint = selectedChef === "vikas" ? "/api/chefVikas" : "/api/chefGordon"

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: currentMessageToSubmit }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `API request failed with status ${response.status}`)
      }

      const data = await response.json()
      const chefResponse = {
        sender: selectedChef === "vikas" ? "Vikas" : "Gordon",
        text: data.message,
      }
      setChatHistory((prev) => [...prev, chefResponse])
    } catch (err) {
      console.error("Failed to send message:", err)
      const errorMessage = err.message || "An unexpected error occurred. Please try again."
      setError(errorMessage)
      setChatHistory((prev) => [...prev, { sender: "System", text: `Error: ${errorMessage}` }])
    } finally {
      setIsLoading(false)
    }
  }

  const getChefDisplayName = (chefKey) => {
    if (chefKey === "vikas") return "Chef Vikas Khanna"
    if (chefKey === "gordon") return "Chef Gordon Ramsay"
    return ""
  }

  const getChefAvatar = (sender) => {
    if (sender === "Vikas") return "VK"
    if (sender === "Gordon") return "GR"
    if (sender === "User") return "U"
    return "S"
  }

  const getAvatarBgColor = (sender) => {
    if (sender === "Vikas") return "bg-emerald-500"
    if (sender === "Gordon") return "bg-rose-500"
    if (sender === "User") return "bg-violet-500"
    return "bg-gray-500"
  }

  const getMessageBubbleColor = (sender) => {
    if (sender === "User") return "bg-violet-600 text-white"
    if (sender === "Vikas") return "bg-emerald-600 text-white"
    if (sender === "Gordon") return "bg-rose-600 text-white"
    return "bg-gray-600 text-white"
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 font-sans antialiased">
      <div
        className="w-full max-w-2xl bg-gray-800 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-gray-700"
        style={{ height: "calc(100vh - 4rem)", maxHeight: "800px" }}
      >
        {!selectedChef ? (
          <div className="flex flex-col items-center justify-center p-8 h-full bg-gradient-to-b from-gray-800 to-gray-900">
            <h1 className="text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400">
              Choose Your Culinary Guide
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-xl">
              <button
                onClick={() => handleChefSelection("vikas")}
                className="group relative p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-emerald-500/20 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold">VK</span>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">Chef Vikas Khanna</h2>
                  <p className="text-sm text-center text-emerald-100">Kind, encouraging, and full of warmth.</p>
                </div>
              </button>

              <button
                onClick={() => handleChefSelection("gordon")}
                className="group relative p-8 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-rose-500/20 hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold">GR</span>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2">Chef Gordon Ramsay</h2>
                  <p className="text-sm text-center text-rose-100">Blunt, critical, and demands perfection.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 rounded-t-xl sticky top-0 z-10 shadow-md">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full ${getAvatarBgColor(selectedChef === "vikas" ? "Vikas" : "Gordon")} flex items-center justify-center text-white font-bold mr-3 text-lg shadow-lg`}
                >
                  {getChefAvatar(selectedChef === "vikas" ? "Vikas" : "Gordon")}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{getChefDisplayName(selectedChef)}</h2>
                  <p className="text-xs text-gray-300">
                    {selectedChef === "vikas" ? "Michelin Star Chef" : "Celebrity Chef"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChef("")}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors duration-150 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Change Chef
              </button>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-grow p-6 space-y-4 overflow-y-auto bg-gradient-to-b from-gray-800 to-gray-900 custom-scrollbar"
            >
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`flex ${chat.sender === "User" ? "justify-end" : "justify-start"} animate-fadeIn`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-xs md:max-w-md lg:max-w-lg ${chat.sender === "User" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full ${getAvatarBgColor(chat.sender)} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
                    >
                      {getChefAvatar(chat.sender)}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-md ${getMessageBubbleColor(chat.sender)} ${
                        chat.sender === "User" ? "rounded-br-none" : "rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{chat.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && selectedChef && (
                <div className="flex justify-start animate-fadeIn">
                  <div className="flex items-end gap-2">
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full ${getAvatarBgColor(selectedChef === "vikas" ? "Vikas" : "Gordon")} flex items-center justify-center text-white font-semibold text-sm shadow-lg`}
                    >
                      {getChefAvatar(selectedChef === "vikas" ? "Vikas" : "Gordon")}
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-gray-700 shadow-md rounded-bl-none">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 rounded-b-xl sticky bottom-0 z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]"
            >
              {error && (
                <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-xs text-center">{error}</p>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={selectedChef === "vikas" ? "Ask Chef Vikas anything..." : "Challenge Chef Ramsay..."}
                  className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all duration-150 text-gray-100 placeholder-gray-400 shadow-inner"
                  disabled={isLoading}
                  aria-label="Chat message input"
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className={`px-6 py-3 ${selectedChef === "vikas" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"} text-white font-semibold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${selectedChef === "vikas" ? "focus:ring-emerald-500" : "focus:ring-rose-500"} shadow-lg`}
                  aria-label="Send message"
                >
                  {isLoading ? <Spinner /> : "Send"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.7);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.8);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.7) rgba(31, 41, 55, 0.5);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}