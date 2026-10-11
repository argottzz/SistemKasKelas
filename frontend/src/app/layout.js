import './globals.css';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider } from '../context/ThemeContext';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'KasSave',
  description: 'KasSave — pencatatan uang kas kelas',
  manifest: '/manifest.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#DBE2EF' },
    { media: '(prefers-color-scheme: dark)', color: '#112D4E' },
  ],
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#112D4E' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ProfileProvider>
            <AppShell>{children}</AppShell>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
