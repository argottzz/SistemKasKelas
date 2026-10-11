import './globals.css';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/Toast';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'KasSave',
  description: 'KasSave — pencatatan uang kas kelas',
  manifest: '/manifest.webmanifest',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#112D4E' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
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
