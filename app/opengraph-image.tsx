import { ImageResponse } from 'next/og'

export const alt = 'Marlow, vacation rentals in Sonoma County'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const regularFont = 'https://fonts.gstatic.com/s/librebaskerville/v24/kmKUZrc3Hgbbcjq75U4uslyuy4kn0olVQ-LglH6T17uj8Q4SCQ.ttf'
const boldFont = 'https://fonts.gstatic.com/s/librebaskerville/v24/kmKUZrc3Hgbbcjq75U4uslyuy4kn0olVQ-LglH6T17ujFgkSCQ.ttf'
const housePhoto = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&h=1260&q=80'

async function load(url: string) {
  try {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  const [regular, bold, photo] = await Promise.all([load(regularFont), load(boldFont), load(housePhoto)])
  const fonts = [
    regular ? { name: 'Libre Baskerville', data: regular, weight: 400 as const, style: 'normal' as const } : null,
    bold ? { name: 'Libre Baskerville', data: bold, weight: 700 as const, style: 'normal' as const } : null,
  ].filter((font) => font !== null)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#f6f1e8',
          color: '#241c18',
          fontFamily: fonts.length ? 'Libre Baskerville' : 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 680,
            padding: '64px 56px 64px 72px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <svg width="56" height="56" viewBox="0 0 32 32">
              <rect width="32" height="32" rx="9" fill="#6e2b3c" />
              <path fill="#fffaf4" d="M16 7.2 6.8 15h2.1v9.2h5.1v-5.4h4v5.4h5.1V15h2.1L16 7.2Z" />
            </svg>
            <div style={{ marginLeft: 16, fontSize: 36, fontWeight: 700 }}>Marlow</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, letterSpacing: 4, color: '#6e2b3c', fontWeight: 700 }}>SONOMA COUNTY</div>
            <div style={{ marginTop: 16, fontSize: 68, lineHeight: 1.02, fontWeight: 700 }}>Homes in Sonoma County.</div>
            <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, color: '#4a3d36' }}>
              River, vineyard, and the coast.
            </div>
          </div>
        </div>
        {photo ? (
          <img src={photo} width={520} height={630} alt="" style={{ width: 520, height: 630, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 520, height: 630, background: '#6e2b3c' }} />
        )}
      </div>
    ),
    {
      ...size,
      fonts,
    }
  )
}
