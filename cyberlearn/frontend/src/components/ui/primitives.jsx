// Primitivos de UI partilhados do design "Cyber Dark refinado".
// Recebem o objeto `theme` por props (mesma fonte de cores da app).

// Avatar circular com gradiente da marca e fallback para a inicial do nome.
export function Avatar({ src, nome, size = 40, theme, fontSize, style }) {
  const inicial = (nome || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
      backgroundColor: theme?.primary || '#3b82f6',
      backgroundImage: theme?.gradient || 'linear-gradient(135deg, #3b82f6, #22d3ee)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: fontSize || Math.round(size * 0.4), ...style,
    }}>
      {src ? <img src={src} alt={`Avatar de ${nome || ''}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : inicial}
    </div>
  );
}

// Cartão base com borda subtil, sombra e (opcional) elevação no hover.
export function Card({ theme, children, style, hover = false, accent }) {
  const base = {
    position: 'relative', backgroundColor: theme.cardBg,
    border: `1px solid ${theme.inputBorder}`, borderRadius: '18px',
    boxShadow: theme.shadow, transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
    ...style,
  };
  if (!hover) return <div style={base}>{children}</div>;
  const c = accent || theme.primary;
  return (
    <div
      style={base}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 18px 40px -18px ${c}66`; e.currentTarget.style.borderColor = `${c}55`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; e.currentTarget.style.borderColor = theme.inputBorder; }}
    >
      {children}
    </div>
  );
}

// Cartão de estatística com ícone em gradiente, número grande e brilho.
export function StatCard({ theme, icon, value, label, sub, color }) {
  const c = color || theme.primary;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden', backgroundColor: theme.cardBg,
        border: `1px solid ${theme.inputBorder}`, borderRadius: '18px', padding: '22px',
        boxShadow: theme.shadow, transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 36px -16px ${c}66`; e.currentTarget.style.borderColor = `${c}55`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadow; e.currentTarget.style.borderColor = theme.inputBorder; }}
    >
      {/* brilho decorativo no canto */}
      <div style={{ position: 'absolute', top: '-45px', right: '-45px', width: '140px', height: '140px', background: `radial-gradient(circle, ${c}33, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundImage: `linear-gradient(135deg, ${c}, ${c}aa)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 16px -4px ${c}80` }}>
          {icon}
        </div>
        {sub && <span style={{ fontSize: '12px', fontWeight: 800, color: c, backgroundColor: `${c}1a`, padding: '4px 10px', borderRadius: '999px' }}>{sub}</span>}
      </div>
      <div style={{ position: 'relative', fontSize: '34px', fontWeight: 900, color: theme.textMain, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ position: 'relative', fontSize: '12px', color: theme.textSub, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '8px' }}>{label}</div>
    </div>
  );
}

// Cabeçalho de secção com barra de acento.
export function SectionTitle({ theme, children, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '4px', height: '18px', borderRadius: '999px', backgroundImage: theme.gradient }} />
      {icon}
      <span style={{ fontWeight: 800, fontSize: '16px', color: theme.textMain }}>{children}</span>
    </div>
  );
}
