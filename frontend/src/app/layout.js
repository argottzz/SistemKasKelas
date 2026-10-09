import './globals.css';
import { AuthProvider } from '../context/AuthContext';
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
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
