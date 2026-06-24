import "./globals.css";
import Providers from './components/Providers';

export const metadata = {
  title: 'Tether Tron USDT Network',
  description: 'USDT Network',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}