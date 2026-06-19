import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import { redirect } from 'next/navigation';
import LoginButton from './components/LoginButton'; // interactive Client component

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/search');
  }

  return (
    <main className="landing-main">
      <div className="landing-hero">
        <h1 className="logo-title">CariSkripsi <span>UPI</span></h1>
        <p className="subtitle">
          Temukan tesis, skripsi, dan karya ilmiah civitas akademika UPI dengan kecerdasan pencarian semantik.
        </p>
        <div className="auth-box">
          <LoginButton />
          <p className="auth-note">Gunakan akun Google universitas (@upi.edu) Anda.</p>
        </div>
        <div className="license-footer">
          Dataset CC BY-SA 4.0 - Repositori UPI
        </div>
      </div>
    </main>
  );
}
