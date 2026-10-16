import './globals.css';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/Toast';
import AppShell from '../components/AppShell';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  title: 'KasSave',
  description: 'KasSave — pencatatan uang kas kelas',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#1E3A5F' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <PwaRegister />
        <ThemeProvider>
          <ProfileProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
