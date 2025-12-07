"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdVideoLibrary, MdFolder, MdMessage } from "react-icons/md";
import { IoSend } from "react-icons/io5";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋 How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage = input.trim();

    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");

    generateBotReply(userMessage);
  };

  const generateBotReply = (message) => {
    let reply;

    // Detect "red car"
    if (/(role|video)/i.test(message)) {
      const id = "167b6f16-5a02-460c-bc46-4d1c6512bdf8";
      reply = {
        sender: "bot",
        type: "attachment",
        icon: MdVideoLibrary,
        title: "Video Found",
        text: "Here is the video you asked for!",
        link: `${APP_URL}/watch/${id}`,
        linkText: "Watch Video",
      };
    }

    // Detect "campaign" or "project"
    else if (/(campaign|project|camp)/i.test(message)) {
      const id = "cmgno4dpc0001l704xpl63zro";
      reply = {
        sender: "bot",
        type: "attachment",
        icon: MdFolder,
        title: "Campaign Found",
        text: "Here is the campaign you referenced!",
        link: `${APP_URL}/campaigns/${id}`,
        linkText: "View Campaign",
      };
    }

    // Default normal reply
    else {
      reply = {
        sender: "bot",
        text: "Try asking about a red car or a campaign to see smart replies 😊",
      };
    }

    setMessages((prev) => [...prev, reply]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[60] bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all"
      >
        <MdMessage className="w-6 h-6" />
      </button>

      {/* Window */}
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
                    /* 🔥 Enhanced Attachment Card with React Icons */
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-fit max-w-[85%] bg-gradient-to-br from-gray-50 to-gray-100 
                                 dark:from-gray-800 dark:to-gray-750 
                                 border-2 border-gray-200 dark:border-gray-700 
                                 rounded-2xl shadow-lg overflow-hidden
                                 hover:shadow-xl transition-all duration-300"
                    >
                      {/* Clickable Icon Section */}
                      <a
                        href={msg.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 
                                   bg-gradient-to-r from-blue-50 to-indigo-50
                                   dark:from-blue-900/20 dark:to-indigo-900/20
                                   hover:from-blue-100 hover:to-indigo-100
                                   dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30
                                   transition-all duration-200 group"
                      >
                        {/* Icon with background */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl 
                                        bg-gradient-to-br from-blue-500 to-indigo-600 
                                        flex items-center justify-center
                                        shadow-md group-hover:scale-110 transition-transform">
                          <msg.icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Title and Link Text */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 
                                          text-sm mb-0.5 truncate">
                            {msg.title}
                          </div>
                          <div className="text-blue-600 dark:text-blue-400 text-xs 
                                          flex items-center gap-1 group-hover:gap-2 
                                          transition-all">
                            <span>{msg.linkText}</span>
                            <svg 
                              className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 5l7 7-7 7" 
                              />
                            </svg>
                          </div>
                        </div>

                        {/* External link indicator */}
                        <div className="flex-shrink-0">
                          <svg 
                            className="w-4 h-4 text-gray-400 dark:text-gray-500 
                                       group-hover:text-blue-500 transition-colors" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                            />
                          </svg>
                        </div>
                      </a>

                      {/* Message Text */}
                      <div className="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm
                                      border-t border-gray-200 dark:border-gray-700/50">
                        {msg.text}
                      </div>
                    </motion.div>
                  ) : (
                    // Normal text bubble
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`w-fit max-w-[75%] px-3 py-2 rounded-xl shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {msg.text}
                    </motion.div>
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
                             text-gray-800 dark:text-gray-200
                             placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                <button
                  onClick={handleSend}
                  className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 
                             hover:scale-110 transition-transform"
                >
                  <IoSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
