import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';
import LoginButton from './components/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/search');

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="Logo CariSkripsi UPI" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold tracking-tight">CariSkripsi UPI</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Pencarian semantik repositori karya ilmiah Universitas Pendidikan Indonesia
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Masuk ke akun Anda</CardTitle>
            <CardDescription>
              Gunakan akun Google universitas untuk mengakses layanan ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginButton />
            <p className="text-xs text-center text-muted-foreground">
              Hanya akun <span className="font-medium">@upi.edu</span> yang diizinkan.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dataset berlisensi{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            CC BY-SA 4.0
          </a>{' '}
          —{' '}
          <a
            href="https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Repositori UPI
          </a>
        </p>
      </div>
    </main>
  );
}
