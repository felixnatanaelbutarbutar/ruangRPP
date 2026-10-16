import type { Metadata } from 'next';
import { Nunito, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-doc',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RuangRPP — Rancang Pembelajaran, Lebih Mudah',
  description: 'Platform digital pendamping guru SD dalam menyusun draf Modul Ajar dan RPP terstruktur berlandaskan Capaian Pembelajaran Kurikulum Nasional.',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="id" className={`${nunito.variable} ${sourceSerif.variable}`}>
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
