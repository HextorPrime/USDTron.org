// 'use client'

// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks'
// import { WalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui'
// import { TronLinkAdapter, WalletConnectAdapter } from '@tronweb3/tronwallet-adapters'
// import { useMemo } from 'react'



// export default function RootLayout({ children }) {
//   const adapters = useMemo(() => [
//     new TronLinkAdapter(),
//     new WalletConnectAdapter({
//       network: 'Mainnet',
//       options: {
//         relayUrl: 'wss://relay.walletconnect.com',
//         projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
//         metadata:metadata
//       },
//     }),
//   ], [])

//   return (
//     <html lang="en">
//       <body>
//         <WalletProvider adapters={adapters} onError={(e) => console.warn(e)}>
//           <WalletModalProvider>
//             {children}
//           </WalletModalProvider>
//         </WalletProvider>
//       </body>
//     </html>
//   )
// }

'use client'

import "./globals.css";
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks'
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters'
import { useMemo } from 'react'

export default function RootLayout({ children }) {
  const adapters = useMemo(() => [new TronLinkAdapter()], [])

  return (
    <html lang="en">
      <body>
        <WalletProvider adapters={adapters} onError={(e) => console.warn(e)}>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}