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

      router.push('/');
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
    <div className="flex-col lg:flex-row flex h-screen w-screen font-sans">
      {/* Left wallpaper with enhanced gradient */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-1/2 bg-gradient-to-br from-primary via-violet-500 to-blue-500 items-center justify-center hidden lg:flex relative overflow-hidden"
      >
        {/* Floating shapes */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-violet-500/30 to-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <motion.img
          src="/images/Login_Side.png"
          alt="Video SaaS Wallpaper"
          className="h-full w-full object-cover opacity-90 relative z-10"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.2 }}
        />
      </motion.div>

      {/* Right Auth Section with glassmorphism */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6 sm:p-8 md:p-12 overflow-y-auto min-h-screen">
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
          className="w-full max-w-md glass-card p-8 md:p-10"
        >
          {/* Dynamic Title */}
          <motion.h1
            key={mode}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent mb-6 tracking-wide text-center"
          >
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </motion.h1>

          {/* Error/Success Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-sm"
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
                className="space-y-2"
              >
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-primary to-violet-500 text-primary-foreground py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
                className="space-y-2.5"
              >
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Workspace Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Workspace Type
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {WORKSPACE_TYPES.map((type) => (
                      <motion.label
                        key={type.value}
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        className={`relative flex items-center px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                          workspaceType === type.value
                            ? 'border-primary/50 bg-primary/10'
                            : 'border-[var(--glass-border)] bg-[var(--glass-hover)] hover:border-primary/30'
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
                        <span className="text-lg mr-3">{type.icon}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                        {workspaceType === type.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-5 h-5 bg-gradient-to-r from-primary to-violet-500 rounded-full flex items-center justify-center shadow-lg"
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
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-hover)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  disabled={true}
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-primary to-violet-500 text-primary-foreground py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </motion.button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-[var(--glass-border)]"></div>
            <span className="px-3 text-muted-foreground text-xs">OR</span>
            <div className="flex-grow h-px bg-[var(--glass-border)]"></div>
          </div>

          {/* Social Login */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 border border-[var(--glass-border)] bg-[var(--glass-hover)] py-3 rounded-xl hover:shadow-md transition-all"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="font-medium text-foreground">
              Continue with Google
            </span>
          </motion.button>

          {/* Toggle between Login/Signup */}
          <motion.p 
            className="text-center text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-primary font-semibold hover:underline focus:outline-none transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={toggleMode}
                  className="text-primary font-semibold hover:underline focus:outline-none transition-colors"
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
