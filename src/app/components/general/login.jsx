'use client';
// import CircularText from "@/components/CircularText";
import CurvedLoop from "@/components/CircularText";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Save JWT in localStorage (later replace with cookie for production)
      localStorage.setItem("token", data.token);

      // Redirect user based on backend decision
      router.push(data.redirect);
    } catch (err) {
      console.error(err);
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans">
      {/* Left wallpaper */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-1/2 bg-gradient-to-br from-purple-700 via-purple-300 to-purple-600 flex items-center justify-center"
      >
        <motion.img
          src="/images/Login_Side.png"
          alt="Video SaaS Wallpaper"
          className="h-full w-full object-cover opacity-80"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
        />
      </motion.div>

      {/* Right Login Section */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-white p-12 shadow-lg">
      <CurvedLoop 
        marqueeText="Create-OS ✦ Where Creativity Meets Control ✦"
        speed={3}
        curveAmount={500}
        direction="right"
        interactive={true}
        className="-mt-20"

        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md"
        >
          {/* Logo / Title */}

          <motion.h1
            className="text-3xl font-bold text-purple-700 mb-6 tracking-wide text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
          <p className="font-serif">Login</p>
          </motion.h1>

          {/* Input fields */}
          <motion.form
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Login Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="flex-grow h-px bg-gray-300"></div>
          </div>

          {/* Social Login */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="font-medium text-gray-700">
              Continue with Google
            </span>
          </motion.button>

          {/* Signup link */}
          <p className="text-center text-gray-600 mt-6">
            Don’t have an account?{" "}
            <a href="/signup" className="text-purple-600 font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
