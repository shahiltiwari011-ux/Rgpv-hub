import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout () {
  return (
    <>
      <Navbar />
      <main style={{ 
        minHeight: '100vh',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
