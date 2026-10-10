import './globals.css';
import { ProfileProvider } from '../context/ProfileContext';
import AppShell from '../components/AppShell';

export const metadata = {
  title: 'KasSave',
  description: 'KasSave — pencatatan uang kas kelas',
  manifest: '/manifest.webmanifest',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ProfileProvider>
          <AppShell>{children}</AppShell>
        </ProfileProvider>
      </body>
    </html>
  );
}
