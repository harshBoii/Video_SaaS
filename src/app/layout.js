import './globals.css';
import MainNav from './components/general/navbar';
import Providers from './provider';
import ChatWidget from './components/general/ChatWidget';
export const metadata = {
  title: 'CreateOs',
  description: 'Your app description',
};

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
      <body>
        <Providers>
          <MainNav/>
          {children}
          <ChatWidget/>
        </Providers>
      </body>
    </html>
  );
}
