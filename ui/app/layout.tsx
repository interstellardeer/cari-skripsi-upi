import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CariSkripsi UPI',
  description: 'Vector search repository skripsi Universitas Pendidikan Indonesia',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
