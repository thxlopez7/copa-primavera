import "./globals.css";

export const metadata = {
  title: "Copa Primavera - Torneo de Pádel",
  description: "Plataforma oficial del torneo Copa Primavera",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="copa-padel-app bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-900 via-navy-950 to-black selection:bg-copaBlue-500 selection:text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
