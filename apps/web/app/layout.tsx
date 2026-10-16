import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'RuangRPP — Rancang Pembelajaran, Lebih Mudah',
  description: 'Platform digital pendamping guru SD dalam menyusun draf Modul Ajar dan RPP terstruktur berlandaskan Capaian Pembelajaran Kurikulum Nasional.',
};
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="id"><body>{children}</body></html>;
}
