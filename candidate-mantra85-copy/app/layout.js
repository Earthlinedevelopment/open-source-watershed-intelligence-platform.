export const metadata = {
  title: "Earthline",
  description: "Aquifer Recharge Starts Here",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
