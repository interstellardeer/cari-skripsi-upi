'use client';

import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const [showAbout, setShowAbout] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-4">
          {/* Brand */}
          <span className="flex items-center gap-2 font-semibold tracking-tight text-sm">
            <img src="/logo.png" alt="Logo" className="h-5 w-5 object-contain" />
            <span>
              CariSkripsi <span className="text-muted-foreground">UPI</span>
            </span>
          </span>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => setShowAbout(true)}
                    className="cursor-pointer"
                  >
                    Tentang Aplikasi
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
          <div className="relative max-w-md w-full border bg-background p-6 shadow-lg rounded-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold mb-2">Tentang CariSkripsi UPI</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              CariSkripsi UPI adalah platform pencarian karya ilmiah Universitas Pendidikan Indonesia berbasis pencarian semantik (Semantic Search) dan asisten kecerdasan buatan (AI Assistant).
            </p>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Sumber Dataset</span>
                <a
                  href="https://www.kaggle.com/datasets/arsyapermana/repository-universitas-pendidikan-indonesia-2025"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline decoration-muted-foreground/30 underline-offset-2 hover:text-foreground transition-colors"
                >
                  Repositori UPI
                </a>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Lisensi Dataset</span>
                <a
                  href="https://creativecommons.org/licenses/by-sa/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline decoration-muted-foreground/30 underline-offset-2 hover:text-foreground transition-colors"
                >
                  CC BY-SA 4.0
                </a>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Jumlah Data</span>
                <span className="font-medium">92.482 Karya Ilmiah</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Fitur Utama</span>
                <span className="font-medium text-right">Pencarian Semantik & AI Chat</span>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowAbout(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
