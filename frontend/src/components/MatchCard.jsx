import React from 'react'

// flagcdn.com ISO-2 codes keyed by team name (EN + ES variants)
const FLAG_ISO = {
  Argentina: 'ar', Brazil: 'br', Brasil: 'br', France: 'fr', Francia: 'fr',
  Germany: 'de', Alemania: 'de', Spain: 'es', España: 'es',
  Italy: 'it', Italia: 'it', Portugal: 'pt',
  Netherlands: 'nl', Holanda: 'nl', 'Países Bajos': 'nl',
  Belgium: 'be', Bélgica: 'be', Uruguay: 'uy',
  Colombia: 'co', Chile: 'cl', Mexico: 'mx', México: 'mx',
  'United States': 'us', 'Estados Unidos': 'us', USA: 'us', Canada: 'ca', Canadá: 'ca',
  Japan: 'jp', Japón: 'jp', 'South Korea': 'kr', 'Corea del Sur': 'kr',
  Australia: 'au', Morocco: 'ma', Marruecos: 'ma', Senegal: 'sn',
  Ghana: 'gh', Cameroon: 'cm', Camerún: 'cm', Nigeria: 'ng',
  Algeria: 'dz', Argelia: 'dz', Tunisia: 'tn', Túnez: 'tn',
  Egypt: 'eg', Egipto: 'eg', 'Ivory Coast': 'ci', 'Costa de Marfil': 'ci',
  Switzerland: 'ch', Suiza: 'ch', Austria: 'at',
  Sweden: 'se', Suecia: 'se', Norway: 'no', Noruega: 'no',
  Denmark: 'dk', Dinamarca: 'dk', Poland: 'pl', Polonia: 'pl',
  Croatia: 'hr', Croacia: 'hr', Serbia: 'rs', Romania: 'ro', Rumanía: 'ro',
  Hungary: 'hu', Hungría: 'hu', 'Czech Republic': 'cz', 'República Checa': 'cz',
  Slovakia: 'sk', Ukraine: 'ua', Ucrania: 'ua', Turkey: 'tr', Turquía: 'tr',
  Greece: 'gr', Grecia: 'gr', Ecuador: 'ec', Peru: 'pe', Perú: 'pe',
  Paraguay: 'py', Venezuela: 've', Bolivia: 'bo',
  'Costa Rica': 'cr', Panama: 'pa', Panamá: 'pa', Honduras: 'hn',
  China: 'cn', Iran: 'ir', Irán: 'ir', Iraq: 'iq', Irak: 'iq',
  'Saudi Arabia': 'sa', 'Arabia Saudita': 'sa', Qatar: 'qa',
  England: 'gb-eng', Scotland: 'gb-sct', Wales: 'cy', Ireland: 'ie',
  Russia: 'ru', Rusia: 'ru',
}

function Crest({ team, size = 44 }) {
  const [failed, setFailed] = React.useState(false)
  const iso = FLAG_ISO[team.name]
  const src = !failed && (team.crest || (iso && `https://flagcdn.com/w80/${iso}.png`))

  if (src) {
    return (
      <img
        src={src}
        alt={team.code}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', border: '1px solid var(--border)' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      display: 'grid', placeItems: 'center',
      background: 'var(--surface-sunken)', border: '1.5px solid ' + (team.color || 'var(--gold)'),
      color: team.color || 'var(--gold)',
      fontFamily: 'var(--font-display)', fontSize: size * 0.4, letterSpacing: '0.02em',
      boxShadow: '0 0 16px -6px ' + (team.color || 'var(--gold)'),
    }}>
      {team.code}
    </div>
  )
}

export function MatchCard({
  home = { code: 'ARG', name: 'Argentina', color: 'var(--gold)' },
  away = { code: 'FRA', name: 'France', color: '#5B8DEF' },
  stage,
  date,
  time,
  venue,
  price,
  remaining,
  total,
  onClick,
  index = 0,
  style: styleProp = {},
}) {
  const [hover, setHover] = React.useState(false)
  const noData = remaining == null || total == null
  const pct = (!noData && total) ? Math.max(0, Math.min(1, remaining / total)) : 0
  const availColor = pct > 0.5 ? 'var(--avail-open)' : pct > 0.15 ? 'var(--avail-low)' : 'var(--avail-sold)'
  const soldOut = !noData && remaining <= 0

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative', width: '100%',
        background: hover ? 'var(--surface-card-2)' : 'var(--surface-card)',
        border: '1px solid ' + (hover ? 'var(--border-gold-strong)' : 'var(--border-gold)'),
        borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer',
        boxShadow: hover
          ? 'var(--glow-gold-lg)'
          : '0 0 0 1px var(--border-gold), 0 10px 30px -22px rgba(0,0,0,0.95)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all var(--dur-base) var(--ease-out)',
        animation: `match-card-in 0.4s var(--ease-out) ${index * 0.06}s both`,
        ...styleProp,
      }}
    >
      {/* stage + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px 0' }}>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-gold)',
        }}>
          {stage || ' '}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, height: 22, padding: '0 9px',
          background: noData ? 'rgba(255,255,255,0.05)' : soldOut || pct < 0.15 ? 'var(--red-100)' : pct < 0.5 ? 'var(--gold-100)' : 'var(--avail-open-100)',
          border: '1px solid ' + (noData ? 'rgba(255,255,255,0.12)' : soldOut || pct < 0.15 ? 'rgba(230,57,70,0.45)' : pct < 0.5 ? 'var(--border-gold-strong)' : 'rgba(45,190,107,0.45)'),
          color: noData ? 'var(--text-tertiary)' : soldOut || pct < 0.15 ? '#FF8088' : pct < 0.5 ? 'var(--gold-bright)' : '#5BE49B',
          borderRadius: 'var(--radius-xs)',
          fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: noData ? 'var(--text-tertiary)' : availColor, boxShadow: noData ? 'none' : '0 0 8px ' + availColor }} />
          {noData ? 'Sin sectores' : soldOut ? 'Sold out' : pct < 0.15 ? 'Few left' : pct < 0.5 ? 'Limited' : 'Available'}
        </span>
      </div>

      {/* teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '20px 18px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          <Crest team={home} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.02em', textAlign: 'center' }}>
            {home.name}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text-tertiary)' }}>VS</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
          <Crest team={away} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.02em', textAlign: 'center' }}>
            {away.name}
          </span>
        </div>
      </div>

      {/* meta: date/venue + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 14px', borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text-primary)', lineHeight: 0.95 }}>
            {[date, time].filter(Boolean).join(' · ')}
          </span>
          {venue && (
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              {venue}
            </span>
          )}
        </div>
        {price != null && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block' }}>
              From
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
              ${price.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* availability */}
      {total > 0 && (
        <div style={{ padding: '12px 18px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              {soldOut ? 'Sold out' : 'Seats left'}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: soldOut ? 'var(--red-bright)' : 'var(--text-primary)' }}>
              {soldOut ? '0' : remaining.toLocaleString()}
              <span style={{ color: 'var(--text-tertiary)' }}> / {total.toLocaleString()}</span>
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--surface-sunken)', border: '1px solid var(--border-soft)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: (pct * 100) + '%', height: '100%',
              background: availColor,
              boxShadow: '0 0 12px ' + availColor,
              borderRadius: 999,
              transition: 'width var(--dur-slow) var(--ease-out)',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchCard
