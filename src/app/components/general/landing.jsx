// /components/CreateOSLandingPage.jsx
'use client';

import { motion } from 'framer-motion';
import { FaCalendarAlt, FaTasks, FaFilm, FaCheckCircle, FaRocket, FaChartLine, FaStar } from 'react-icons/fa';
import Sparkle from "react-sparkle";
import { useState } from 'react';
import Marquee from "react-fast-marquee";
import { FaTwitter, FaGithub, FaLinkedin } from "react-icons/fa";


// Helper for animations
const sectionAnimation = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' },
  viewport: { once: true },
};

// Main Component
const CreateOSLandingPage = () => {
  return (
    <div className="bg-gray-50 text-gray-900 font-sans">
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <WorkflowSection />
        <TestimonialsSection />
        <AnalyticsSection />
        <PricingSection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
};

const HeroSection = () => (
  <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-white mt-40">
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-serif mb-4 max-w-4xl mx-auto">
        Manage 
    <span className=" ml-3 relative inline-block bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
        Creative Content
    </span>
     End-to-End. In One Place.
    </h1>
      <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
        One platform for campaign planning, task automation, creative uploads, review cycles, and cross-platform launches.
      </p>
      <div className="flex justify-center gap-4 mb-12">
        <button className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300">
          Start Free Trial
        </button>
    <button className="relative bg-transparent border-2 border-gray-300 text-gray-700 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors duration-300">
      Watch Demo
            <Sparkle
            color="#FFD700" 
            count={3}
            minSize={20}
            maxSize={25}
            flicker={true}
            fadeOutSpeed={10}
            overflowPx={0}
            style={{ position: "absolute", top: 0, right: 0 }}
            />
    </button>
      </div>
    </motion.div>
    <motion.div
      className="w-full max-w-5xl mx-auto px-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
    >
      {/* Animated dashboard preview - using a high-quality image as a placeholder.
          For a real animation, you could use a looping video or a Lottie animation.
          GSAP could also be used here for more complex, sequenced animations. */}
      <div className="bg-white rounded-xl shadow-2xl p-2 border border-gray-200 ">
            <iframe
            src="https://www.youtube.com/embed/ApyZ1ryBBz8"
            title="Animated dashboard preview"
            className="w-full h-200 rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            />
      </div>
    </motion.div>
  </section>
);

const ProblemSection = () => (
  <motion.section {...sectionAnimation} className="py-20 sm:py-32 px-4 bg-white">
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div className="text-left">
        <h2 className="text-4xl font-bold mb-6">No more <span className='bg-red-200'> messy spreadsheets </span> or endless email chains.</h2>
        <p className="text-gray-600 text-lg mb-4">
          Creative campaigns get chaotic fast. Scattered workflows, missed deadlines, asset chaos, and unclear feedback loops are the enemy of great work.
        </p>
        <p className="text-gray-600 text-lg">
          CreateOS brings everything—and everyone—together, giving you a single source of truth from brief to launch.
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-xl p-2 border border-gray-200">
        <img
          src="https://images.pexels.com/photos/9034260/pexels-photo-9034260.jpeg"
          alt="Unified workflow in CreateOS"
          className="rounded-md w-full h-auto"
        />
      </div>
    </div>
  </motion.section>
);

const features = [
  { icon: FaCalendarAlt, title: "Campaign & Timeline Management", description: "Plan your entire campaign on a visual, collaborative calendar." },
  { icon: FaTasks, title: "Automated Task & Workflow Tracking", description: "Assign tasks and watch them move across your custom workflow stages." },
  { icon: FaFilm, title: "Creative Asset Upload with Version Control", description: "Store all assets in one place with crystal-clear version history." },
  { icon: FaCheckCircle, title: "Structured Review & Approval Cycles", description: "Get targeted feedback and approvals without leaving the platform." },
  { icon: FaRocket, title: "Cross-Platform Launch & Scheduling", description: "Schedule and launch approved content directly to your social channels." },
  { icon: FaChartLine, title: "Performance Analytics & Insights", description: "Track campaign performance and get insights on what's working." },
];

const FeaturesSection = () => {
      const [fallen, setFallen] = useState(false);
    return (
  <motion.section {...sectionAnimation} className="py-20 sm:py-32 px-4">
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-4xl font-bold mb-4 onMouseEnter={() => setFallen(true)}"><span className='bg-amber-200'>Everything </span> you need.      
        <motion.span
          className="block text-gray-700"
          initial={{ y: 0, opacity: 1 }}
          whileHover={{ y: 30, opacity: 0 }}   // 👈 falls on hover
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
        >
          Nothing you don’t.
        </motion.span>
</h2>
      <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">A powerful toolset designed to eliminate friction from your creative process.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <div className="text-blue-600 mb-4">
              <feature.icon size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.section>
    )
};

const workflowSteps = [
    { name: "Super Admin Setup", description: "Configure teams, workflows, and integrations." },
    { name: "Campaign Creation", description: "Define goals, timelines, and deliverables for your new campaign." },
    { name: "Task Assignment", description: "Assign tasks to team members with clear deadlines." },
    { name: "Asset Upload", description: "Creatives upload their work for review." },
    { name: "Review Cycle", description: "Stakeholders provide feedback and approve assets." },
    { name: "Launch", description: "Approved content is scheduled and published." },
];

const WorkflowSection = () => (
    <motion.section {...sectionAnimation} className="py-20 sm:py-32 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">From Brief to Launch — all in one smooth flow.</h2>
            <p className="text-lg text-gray-600 mb-16 max-w-3xl mx-auto">Our structured workflow ensures everyone is on the same page, every step of the way.</p>
            <div className="relative flex flex-col md:flex-row justify-between items-center w-290">
                {/* Dashed line for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 border-t-2 border-dashed border-gray-300 transform -translate-y-1/2"></div>
                
                {workflowSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      className="relative z-10 flex flex-col items-center text-center  w-full md:w-auto mb-8 md:mb-0"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 0.7, scale: 0.9 }}
                      whileHover={{ y: 10, scale:1.05 , opacity:1 }}   // 👈 falls on hover
                      transition={{ type: "spring" , duration: 0.5, delay: index * 0.15 }}
                      viewport={{ once: true }}
                    >
                        <div className="bg-white border-2 border-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl mb-4 shadow-md">
                            {index + 1}
                        </div>
                        <h3 className="font-semibold">{step.name}</h3>
                        <p className="text-sm text-gray-500 max-w-md max-h-5 mt-1">{step.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </motion.section>
);

const logos = [
  "https://www.vectorlogo.zone/logos/google/google-ar21.svg",
  "https://www.vectorlogo.zone/logos/netflix/netflix-ar21.svg",
  "https://www.vectorlogo.zone/logos/airbnb/airbnb-ar21.svg",
  "https://www.vectorlogo.zone/logos/spotify/spotify-ar21.svg",
  "https://www.vectorlogo.zone/logos/slack/slack-ar21.svg",
];


const reviews = [
  {
    text: "CreateOS cut our campaign turnaround time by 40%. The team is happier, and our work is better.",
    name: "Sarah Jones",
    role: "Creative Director",
    company: "Global Tech Inc.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg"
  },
  {
    text: "Our workflow has never been smoother. The collaboration tools are fantastic!",
    name: "James Lee",
    role: "Marketing Lead",
    company: "Bright Media",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg"
  },
  {
    text: "A complete game-changer for our creative department. We ship faster and with more confidence.",
    name: "Emily Carter",
    role: "Head of Design",
    company: "VisionWorks",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg"
  },
  {
    text: "The best investment we made this year. It streamlined everything.",
    name: "Daniel Kim",
    role: "Product Manager",
    company: "NextWave",
    avatar: "https://randomuser.me/api/portraits/men/56.jpg"
  }
];

const TestimonialsSection = () => (
  <motion.section className="py-20 sm:py-32 px-4 bg-gray-50">
    <div className="max-w-6xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-12">
        Trusted by the world's most innovative teams
      </h2>

      {/* ✅ Marquee Reviews */}
      <Marquee pauseOnHover 
        gradient={true}
        speed={50}>
        {reviews.map((review, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl h-70 shadow-lg border border-gray-200 mx-6 p-6 w-80 flex-shrink-0 transition-transform hover:-translate-y-2 duration-300"
          >
            {/* Stars */}
            <div className="flex justify-center text-yellow-400 mb-4">
              {[...Array(5)].map((_, idx) => <FaStar key={idx} />)}
            </div>

            {/* Review Text */}
            <blockquote className="text-base text-gray-700 italic leading-relaxed mb-6">
              “{review.text}”
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-3">
              <img
                src={review.avatar}
                alt={review.name}
                className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
              />
              <div className="text-left">
                <p className="font-semibold text-gray-800">{review.name}</p>
                <p className="text-sm text-gray-500">
                  {review.role}, {review.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  </motion.section>
);


const AnalyticsSection = () => (
  <motion.section {...sectionAnimation} className="py-20 sm:py-32 px-4 bg-white">
    <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div className="bg-white rounded-lg shadow-xl p-2 border border-gray-200">
        <img
          src="https://images.pexels.com/photos/3183153/pexels-photo-3183153.jpeg"
          alt="Analytics dashboard in CreateOS"
          className="rounded-md w-full h-auto"
        />
      </div>
      <div className="text-left">
        <h2 className="text-4xl font-bold mb-6">Know what works. Double down on it.</h2>
        <p className="text-gray-600 text-lg mb-4">
          <span className='text-red-700'>Stop </span> guessing. Our <span className='bg-emerald-200'> built-in analytics dashboard</span> gives you a clear view of campaign performance. Track key metrics like click-through rates, conversions, and team efficiency to make data-driven decisions.
        </p>
        <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-600"/> Real-time performance tracking</li>
            <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-600"/> Identify top-performing content</li>
            <li className="flex items-center gap-2"><FaCheckCircle className="text-blue-600"/> Measure team productivity and bottlenecks</li>
        </ul>
      </div>
    </div>
  </motion.section>
);

const PricingSection = () => (
    <motion.section {...sectionAnimation} className="py-20 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-4 inline-block relative">
        Simple, clear pricing
        <motion.span
            className="absolute left-0 -bottom-2 w-full h-1 rounded bg-gradient-to-r from-blue-300 via-purple-400 to-pink-500"
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{
            duration: 5,
            repeat: Infinity,
            ease: "linear"
            }}
            style={{
            backgroundSize: "200% 200%" // 👈 important for animation
            }}
        />
        </h2>
            <p className="text-lg text-gray-600 mb-16">Choose the plan that's right for your team.</p>
            <div className="grid lg:grid-cols-3 gap-8 items-stretch">
                {/* Pricing Tier 1 */}
                <div className="bg-white p-8 rounded-xl shadow-lg border flex flex-col hover:shadow-2xl transition-shadow duration-300">
                    <h3 className="text-2xl font-semibold mb-2">Starter</h3>
                    <p className="text-gray-500 mb-6">For small teams and freelancers.</p>
                    <p className="text-4xl font-bold mb-6">$0<span className="text-lg font-normal text-gray-500">/mo for 14 days</span></p>
                    <ul className="space-y-4 text-left mb-8 flex-grow">
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Up to 5 users</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> 10 GB Storage</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Core Workflow Features</li>
                    </ul>
                    <button className="w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-colors duration-300">Start 14-Day Trial</button>
                </div>

                {/* Pricing Tier 2 (Highlighted) */}
                <div className="bg-white p-8 rounded-xl shadow-2xl border-2 border-blue-600 relative flex flex-col">
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                        <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase">Most Popular</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Growth</h3>
                    <p className="text-gray-500 mb-6">For growing creative teams.</p>
                    <p className="text-4xl font-bold mb-6">$49<span className="text-lg font-normal text-gray-500">/user/mo</span></p>
                    <ul className="space-y-4 text-left mb-8 flex-grow">
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Up to 50 users</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> 1 TB Storage</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Advanced Workflows</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Basic Analytics</li>
                    </ul>
                    <button className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300">Choose Growth</button>
                </div>
                
                {/* Pricing Tier 3 */}
                <div className="bg-white p-8 rounded-xl shadow-lg border flex flex-col hover:shadow-2xl transition-shadow duration-300">
                    <h3 className="text-2xl font-semibold mb-2">Enterprise</h3>
                    <p className="text-gray-500 mb-6">For large-scale organizations.</p>
                    <p className="text-4xl font-bold mb-6">Let's Talk</p>
                    <ul className="space-y-4 text-left mb-8 flex-grow">
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Unlimited Users</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Unlimited Storage</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Premium Analytics & SSO</li>
                        <li className="flex items-center gap-3"><FaCheckCircle className="text-blue-600"/> Dedicated Support</li>
                    </ul>
                    <button className="w-full bg-gray-800 text-white font-semibold py-3 rounded-lg hover:bg-gray-900 transition-colors duration-300">Contact Sales</button>
                </div>
            </div>
        </div>
    </motion.section>
);



const FinalCTASection = () => (
  <section className="py-20 px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-12 rounded-xl shadow-xl"
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-4xl font-bold mb-4"
      >
        Ready to simplify your content workflow?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="text-lg mb-8 opacity-90"
      >
        Stop the chaos. Start creating.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.1, boxShadow: "0px 8px 24px rgba(0,0,0,0.2)" }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="bg-white text-blue-600 font-bold py-4 px-10 rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-300 text-lg"
      >
        Start Free Trial Today
      </motion.button>
    </motion.div>
  </section>
);




const Footer = () => (
  <motion.footer
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    viewport={{ once: true }}
    className="bg-gradient-to-r from-gray-50 to-gray-100 py-12 px-4 border-t border-gray-200"
  >
    <div className="max-w-6xl mx-auto text-center text-gray-600">
      
      {/* Navigation Links */}
      <div className="flex justify-center gap-8 mb-6 flex-wrap">
        {["Features", "Pricing", "Blog", "Contact", "Docs"].map((link, i) => (
          <motion.a
            key={i}
            href="#"
            whileHover={{ y: -4, color: "#2563eb" }} // Tailwind blue-600
            transition={{ type: "spring", stiffness: 300 }}
            className="font-medium transition-colors"
          >
            {link}
          </motion.a>
        ))}
      </div>

      {/* Social Media */}
      <div className="flex justify-center gap-6 mb-8">
        {[FaTwitter, FaGithub, FaLinkedin].map((Icon, i) => (
          <motion.a
            key={i}
            href="#"
            whileHover={{
              scale: 1.2,
              color: "#2563eb",
              textShadow: "0px 0px 8px rgba(37, 99, 235, 0.8)"
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-xl"
          >
            <Icon />
          </motion.a>
        ))}
      </div>

      {/* Footer Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-sm"
      >
        &copy; {new Date().getFullYear()} CreateOS. All rights reserved.
      </motion.p>
    </div>
  </motion.footer>
);




export default CreateOSLandingPage;
