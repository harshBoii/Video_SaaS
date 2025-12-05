'use client';

import CurvedLoop from "@/components/CircularText";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Workspace type options
const WORKSPACE_TYPES = [
  { 
    value: 'SOLO', 
    label: 'Solo Creator', 
    description: 'For individuals and freelancers',
    icon: '👤'
  },
  { 
    value: 'TEAM', 
    label: 'Team', 
    description: 'For small teams (2-50 members)',
    icon: '👥'
  },
  { 
    value: 'ENTERPRISE', 
    label: 'Enterprise', 
    description: 'For large organizations (50+ members)',
    icon: '🏢'
  }
];

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [workspaceType, setWorkspaceType] = useState("SOLO"); // Default to solo
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login handler (unchanged)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push(data.redirect);
    } catch (err) {
      console.error(err);
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Signup handler with new fields
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!signupName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: signupName,
          email: signupEmail, 
          password: signupPassword,
          workspaceType: workspaceType
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setError("This email is already registered. Please login instead.");
        } else if (data.code === 'VALIDATION_ERROR') {
          setError(data.details?.[0]?.message || data.error);
        } else if (data.code === 'RATE_LIMIT_EXCEEDED') {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(data.error || "Signup failed");
        }
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully! Logging you in...");
      
      // Auto-login after signup
      setTimeout(async () => {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signupEmail, password: signupPassword }),
        });

        const loginData = await loginRes.json();
        
        if (loginRes.ok) {
          router.push(loginData.redirect);
        } else {
          setMode("login");
          setLoginEmail(signupEmail);
          setSuccess("Account created! Please login.");
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      setError("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setSuccess("");
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

      {/* Right Auth Section */}
      <div className="w-1/2 flex flex-col items-center justify-center bg-white p-12 shadow-lg overflow-y-auto">
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
          {/* Dynamic Title */}
          <motion.h1
            key={mode}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="text-3xl font-bold text-purple-700 mb-6 tracking-wide text-center font-serif"
          >
            {mode === "login" ? "Login" : "Create Account"}
          </motion.h1>

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms Container */}
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              // LOGIN FORM
              <motion.form
                key="login"
                onSubmit={handleLogin}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </motion.button>
              </motion.form>
            ) : (
              // SIGNUP FORM
              <motion.form
                key="signup"
                onSubmit={handleSignup}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Workspace Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Workspace Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {WORKSPACE_TYPES.map((type) => (
                      <motion.label
                        key={type.value}
                        whileHover={{ scale: 1.02 }}
                        className={`relative flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          workspaceType === type.value
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="workspaceType"
                          value={type.value}
                          checked={workspaceType === type.value}
                          onChange={(e) => setWorkspaceType(e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-3">{type.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                        {workspaceType === type.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center"
                          >
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full mt-2 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </motion.form>
            )}
          </AnimatePresence>

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

          {/* Toggle between Login/Signup */}
          <motion.p 
            className="text-center text-gray-600 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-purple-600 font-medium hover:underline focus:outline-none"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-purple-600 font-medium hover:underline focus:outline-none"
                >
                  Login
                </button>
              </>
            )}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
