import type { Metadata } from 'next';
import './globals.css';
import Providers from '../components/Providers';

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
        <Providers>
          <div className="app-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
