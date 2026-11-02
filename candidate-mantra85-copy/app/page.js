export default function Home() {
  return (
    <main style={{
      padding: "40px",
      fontFamily: "Arial, sans-serif",
      maxWidth: "1400px",
      margin: "0 auto"
    }}>
      <h1>Earthline Watershed Intelligence Platform</h1>

      <p>
        Analyze any location on Earth for watershed restoration,
        aquifer recharge, bioswale placement, and climate resilience.
      </p>

      <input
        placeholder="Enter a property, city, county, state, country, or GPS coordinates..."
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "18px",
          marginTop: "20px",
          marginBottom: "20px"
        }}
      />

      <button
        style={{
          padding: "14px 24px",
          fontSize: "18px",
          cursor: "pointer"
        }}
      >
        Analyze Location
      </button>

      <div
        style={{
          marginTop: "40px",
          height: "500px",
          background: "#e9eef2",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        Future Hydrology Map
      </div>
    </main>
  );
}
