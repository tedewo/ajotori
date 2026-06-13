export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#ffffff",
      color: "#000000",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Arial",
      padding: "40px"
    }}>
      
      {/* Logo */}
      <h1 style={{ fontSize: 52, marginBottom: 10, letterSpacing: 2 }}>
        AJOTORI
      </h1>

      {/* Slogan */}
      <p style={{ fontSize: 18, opacity: 0.7, marginBottom: 50 }}>
        Löydä ja myy ajoneuvot helposti
      </p>

      {/* Categories */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 200px)",
        gap: 20
      }}>

        <div style={cardStyle}>🚗 Autot</div>
        <div style={cardStyle}>🏍 Motot</div>
        <div style={cardStyle}>🚜 Maatalouskoneet</div>
        <div style={cardStyle}>🚧 Maanrakennuskoneet</div>
        <div style={cardStyle}>🚛 Kuorma-autot</div>
        <div style={cardStyle}>📦 Muut</div>

      </div>

    </main>
  );
}

const cardStyle = {
  background: "#f0f0f0",
  padding: "30px",
  borderRadius: "14px",
  textAlign: "center",
  fontSize: "18px",
  cursor: "pointer",
  transition: "0.2s",
  userSelect: "none"
};
