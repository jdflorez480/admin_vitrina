import Link from 'next/link'
import FullLogo from './FullLogo'

/** Sólo el escudo, enlazado al panel. */
const Logo = () => (
  <Link href='/' aria-label='Vitrina Raíz'>
    <FullLogo markOnly />
  </Link>
)

export default Logo
