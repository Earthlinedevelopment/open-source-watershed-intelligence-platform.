export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f7f2",
        fontFamily: "Arial, sans-serif",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <img
            src="/earthline-logo-master.png"
            alt="Earthline"
            style={{
              width: "120px",
              height: "auto",
            }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                color: "#2f4f2f",
                fontSize: "3rem",
              }}
            >
              Earthline
            </h1>

            <p
              style={{
                margin: 0,
                color: "#666",
                fontSize: "1.1rem",
              }}
            >
              Aquifer Recharge Starts Here
            </p>
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0 2px 10px rgba(0,0,0,.08)",
          }}
        >
          <h2>Search Any Location On Earth</h2>

          <input
            placeholder="Enter property address, city, county, state or country..."
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "18px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginBottom: "20px",
            }}
          />

          <button
            style={{
              background: "#2f6b3f",
              color: "white",
              padding: "14px 28px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            Run Earthline Analysis
          </button>
        </div>

        <div
          style={{
            height: "600px",
            background: "#dbe7f0",
            borderRadius: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "24px",
            color: "#444",
            marginBottom: "30px",
          }}
        >
          Interactive Watershed Map Coming Next
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>Recharge Potential</h3>
            <p>Awaiting analysis.</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>Swale Opportunities</h3>
            <p>Awaiting analysis.</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>Aquifer Data</h3>
            <p>Awaiting analysis.</p>
          </div>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <h3>Climate Trends</h3>
            <p>Awaiting analysis.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
