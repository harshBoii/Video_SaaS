"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋 How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL; // used for links

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");

    generateBotReply(userMessage);
  };

  const generateBotReply = (message) => {
    let reply = null;

    // 1) Detect “red car” request
    if (/red\s*car/i.test(message)) {
      const id = "123"; // You will replace dynamically
      reply = {
        sender: "bot",
        type: "attachment",
        icon: "🚗",
        text: "Here is the video you asked for!",
        link: `${APP_URL}/watch/${id}`,
      };
    }

    // 2) Detect “campaign” or “project”
    else if (/(campaign|project)/i.test(message)) {
      const id = "99"; // You will replace dynamically
      reply = {
        sender: "bot",
        type: "attachment",
        icon: "📌",
        text: "Here is the campaign you referenced!",
        link: `${APP_URL}/campaigns/${id}`,
      };
    }

    // Default fallback reply
    else {
      reply = {
        sender: "bot",
        text: "Thanks! I'm here — ask about a red car or a campaign to see demo attachments.",
      };
    }

    setMessages((prev) => [...prev, reply]);
  };

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[60] bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        💬
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[450px]
                       bg-white dark:bg-gray-900 backdrop-blur-lg
                       rounded-2xl shadow-2xl border border-gray-200
                       dark:border-gray-700 z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3
                            bg-gradient-to-r from-blue-600 to-indigo-700
                            text-white rounded-t-2xl">
              <div className="font-semibold">AI Assistant</div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white text-lg"
              >
                ✖
              </button>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="flex-1 px-4 py-3 overflow-y-auto space-y-3 
                         text-sm text-gray-800 dark:text-gray-200"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.type === "attachment" ? (
                    <a
                      href={msg.link}
                      target="_blank"
                      className="flex items-center gap-2 w-fit max-w-[75%]
                                 bg-gradient-to-r from-indigo-500 to-blue-600
                                 text-white px-3 py-2 rounded-xl shadow-md 
                                 hover:scale-[1.02] transition"
                    >
                      <span className="text-lg">{msg.icon}</span>
                      <span>{msg.text}</span>
                    </a>
                  ) : (
                    <div
                      className={`w-fit max-w-[75%] px-3 py-2 rounded-xl shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800
                              rounded-xl px-3 py-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-sm
                             text-gray-800 dark:text-gray-200"
                />
                <button
                  onClick={handleSend}
                  className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 font-bold"
                >
                  ➤
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
