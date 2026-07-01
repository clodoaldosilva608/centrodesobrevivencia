import MapaTatico from "@/components/gis/MapaTatico";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";

const Gis = () => (
  <>
    <SEO
      title="GIS Tático | Survival Hub"
      description="Mapa tático de sobrevivência com múltiplas camadas (satélite, topográfico, XYZ/WMTS), coordenadas em DD/DMS/MGRS e cache offline de tiles."
    />
    <div className="fixed inset-0 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 relative">
        <MapaTatico />
      </main>
    </div>
  </>
);

export default Gis;
