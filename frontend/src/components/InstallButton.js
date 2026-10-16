'use client';
import { useEffect, useState } from 'react';
import { Icon } from './icons';

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallButton({ large = false }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIos());
    setInstalled(isStandalone());
    const onBefore = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return <div className="okbox" style={{ marginBottom: 0 }}>Aplikasi sudah terinstall di perangkat ini.</div>;
  }

  // iPhone: tidak ada prompt otomatis -> arahkan ke panduan manual di /unduh.
  if (ios && !deferred) {
    return (
      <a className="btn btn-download" href="/unduh#iphone" style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: large ? '100%' : undefined }}>
        <Icon name="download" size={18} /> Download Aplikasi
      </a>
    );
  }

  const install = async () => {
    try {
      if (!deferred) {
        window.location.href = '/unduh';
        return;
      }
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } catch {}
  };

  return (
    <button type="button" className="btn btn-download" onClick={install} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifyContent: 'center', width: large ? '100%' : undefined }}>
      <Icon name="download" size={18} /> Download Aplikasi
    </button>
  );
}
