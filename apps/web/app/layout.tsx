import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'RuangRPP — Rancang Pembelajaran, Lebih Mudah',
  description: 'Platform digital pendamping guru SD dalam menyusun draf Modul Ajar dan RPP terstruktur berlandaskan Capaian Pembelajaran Kurikulum Nasional.',
};

export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="id" className={font.variable}>
      <body className={font.className}>{children}</body>
    </html>
  );
}
