import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Year 10 Geography Exam Coach v47'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
