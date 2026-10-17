'use client';
import { useEffect } from 'react';
import { LandingView } from './landing';

export default function Page() {
  useEffect(() => {
    const legacy = ['overview', 'documents', 'verified', 'review', 'requirements', 'vectors', 'models', 'users', 'activity', 'finance', 'admin', 'login'];
    if (legacy.includes(window.location.hash.slice(1))) window.location.replace(`/admin${window.location.hash}`);
  }, []);
  return <LandingView onOpenLogin={() => window.location.assign('/admin')} />;
}
