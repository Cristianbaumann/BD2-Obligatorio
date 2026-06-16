import Navbar from './Navbar'

export default function Layout({
  children,
  brand = 'MUNDIAL 2026',
  links = [],
  backTo = null,
  backLabel = 'Volver',
  rightSlot = null,
}) {
  return (
    <div className="ambient-bg" style={{ minHeight: '100vh' }}>
      <Navbar brand={brand} links={links} backTo={backTo} backLabel={backLabel} rightSlot={rightSlot} />
      <div style={{ paddingTop: '64px' }}>
        {children}
      </div>
    </div>
  )
}
