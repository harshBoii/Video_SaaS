import './globals.css';
import MainNav from './components/general/navbar';
import Providers from './provider';
import ChatWidget from './components/general/ChatWidget';
import { Inter, Geist, Geist_Mono, Poppins } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: '500',
  subsets: ["latin"],
});

export const metadata = {
  title: "Clipfox | AI + Human-in-the-Loop OS for Growth Marketing Teams",
  description:
    "Clipfox is the all-in-one operating system for growth marketing teams. Automate workflows, create intelligent content, streamline approvals, and scale results with AI + human collaboration.",
  metadataBase: new URL("https://clipfox.studio"),
  openGraph: {
    title: "Clipfox | AI + Human-in-the-Loop OS for Growth Marketing Teams",
    description:
      "Supercharge your growth marketing with Clipfox — an AI-powered OS designed for modern teams. Automate tasks, collaborate in real-time, and scale effortlessly.",
    url: "https://clipfox.studio",
    siteName: "Clipfox",
    images: [
      {
        url: "/og/clipfox-home.jpg", // update to your actual OG image path
        width: 1200,
        height: 630,
        alt: "Clipfox - AI OS for Growth Marketing Teams",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipfox | AI OS for Growth Marketing Teams",
    description:
      "Transform how your growth team works with Clipfox — AI + human-in-the-loop workflows, automation, and collaboration in one powerful platform.",
    images: ["/og/clipfox-home.jpg"],
    site: "@clipfox", // update if you have a Twitter handle
  },
};

import GoogleAuthProviderWrapper from './context/GoogleOauthProvider';
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}

      >
        <GoogleAuthProviderWrapper>
        <Providers>
          <MainNav/>
          {children}
          <ChatWidget/>
        </Providers>
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
