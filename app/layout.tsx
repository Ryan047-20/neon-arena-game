import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Neon Arena', description: 'A small 3D survival arena. Move, jump, and pulse your way through the swarm.' };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

