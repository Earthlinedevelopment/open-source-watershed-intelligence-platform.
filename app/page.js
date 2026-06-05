export default function Home() {
  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto"
      }}
    >
      <h1>Earthline</h1>

      <h2>Aquifer Recharge Starts Here</h2>

      <p>
        How can this landscape recharge more water,
        retain more soil, and become more resilient?
      </p>

      <input
        placeholder="Search a property, city, watershed, region, or nation..."
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "12px",
          marginTop: "20px"
        }}
      />

      <div style={{ marginTop: "40px" }}>
        <h3>Earthline Principles</h3>

        <ul>
          <li>💧 Recharge Aquifers</li>
          <li>🌱 Retain Soil</li>
          <li>🏞️ Restore & Preserve Landscapes</li>
          <li>📈 Measure Outcomes</li>
        </ul>
      </div>
    </main>
  );
}
