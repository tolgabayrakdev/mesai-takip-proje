import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import SignIn from './pages/auth/sign-in';
import { ThemeProvider } from './components/theme-provider';


const router = createBrowserRouter([
  {
    path: "/",
    element: <SignIn />
  }
]);



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
)
