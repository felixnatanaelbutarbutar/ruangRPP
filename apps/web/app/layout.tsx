import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Admin RuangRPP', description: 'Kelola sumber pembelajaran dan operasional RuangRPP.' };
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="id"><body>{children}</body></html>;
}
