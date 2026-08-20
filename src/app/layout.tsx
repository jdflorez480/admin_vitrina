import React from 'react'
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './css/globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import ServiceWorkerRegister from '@/app/components/service-worker/ServiceWorkerRegister'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Vitrina Raíz · Panel de administración',
    template: '%s · Vitrina Raíz',
  },
  description:
    'Panel de administración de Vitrina Raíz: métricas de la plataforma, usuarios, propiedades y suscripciones.',
  applicationName: 'Vitrina Raíz Admin',
  // El panel es privado: no queremos que los buscadores lo indexen.
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <html lang='es' suppressHydrationWarning>
      <head>
        <link rel='icon' href='/favicon.png' type='image/png' sizes='64x64' />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' sizes='180x180' />
        <link rel='manifest' href='/manifest.json' />
        {/* El color de la barra del navegador sigue al tema activo. */}
        <meta
          name='theme-color'
          content='#f4f7fc'
          media='(prefers-color-scheme: light)'
        />
        <meta
          name='theme-color'
          content='#081730'
          media='(prefers-color-scheme: dark)'
        />
      </head>
      <body className={`${dmSans.className}`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange>
          <ServiceWorkerRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
