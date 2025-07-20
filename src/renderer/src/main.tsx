import './assets/main.css'
import '@radix-ui/themes/styles.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { Theme } from '@radix-ui/themes'
import { Toaster } from 'sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme appearance='dark'>
      <App />
      <Toaster richColors />
    </Theme>
  </StrictMode>
)
