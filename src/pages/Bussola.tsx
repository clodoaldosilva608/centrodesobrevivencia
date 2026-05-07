import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Navigation,
  MapPin,
  Mountain,
  Sun,
  Moon,
  Thermometer,
  Wind,
  LocateFixed,
  RotateCcw,
  Flashlight,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { playDiscoverSound } from "@/lib/sounds";

// Conversões de coordenadas
function toDMS(deg: number, isLat: boolean): string {
  const dir = isLat ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d - m / 60) * 3600).toFixed(1);
  return `${d}°${m}'${s}"${dir}`;
}

function getCardinal(heading: number): string {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(heading / 45) % 8];
}

function getSunPosition(lat: number, lng: number): { altitude: number; azimuth: number; isDay: boolean } {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const hourAngle = ((now.getUTCHours() + now.getUTCMinutes() / 60 + lng / 15) - 12) * 15;
  const latRad = (lat * Math.PI) / 180;
  const decRad = (declination * Math.PI) / 180;
  const haRad = (hourAngle * Math.PI) / 180;
  const altitude =
    Math.asin(Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)) *
    (180 / Math.PI);
  const azimuth =
    Math.atan2(
      Math.sin(haRad),
      Math.cos(haRad) * Math.sin(latRad) - Math.tan(decRad) * Math.cos(latRad)
    ) *
      (180 / Math.PI) +
    180;
  return { altitude, azimuth: azimuth % 360, isDay: altitude > 0 };
}

const Bussola = () => {
  const { user } = useAuth();
  const [heading, setHeading] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; alt: number | null; accuracy: number } | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [compassError, setCompassError] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Bússola via DeviceOrientation
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      // iOS usa webkitCompassHeading, Android usa alpha
      const h = (e as any).webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) % 360 : null);
      if (h != null) {
        setHeading(Math.round(h));
        setCompassError(null);
      }
    };

    // iOS 13+ requer permissão
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((perm: string) => {
          if (perm === "granted") {
            window.addEventListener("deviceorientation", handler, true);
          } else {
            setCompassError("Permissão da bússola negada");
          }
        })
        .catch(() => setCompassError("Erro ao solicitar permissão da bússola"));
    } else {
      window.addEventListener("deviceorientation", handler, true);
      // Se depois de 3s não tiver heading, mostrar modo simulado
      const t = setTimeout(() => {
        setHeading((prev) => (prev === null ? 0 : prev));
        if (heading === null) setCompassError("Bússola não disponível — modo demonstração");
      }, 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("deviceorientation", handler, true);
      };
    }

    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  // Geolocalização
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocError("Geolocalização não suportada");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude,
          accuracy: pos.coords.accuracy,
        });
        setSpeed(pos.coords.speed);
        setLocError(null);
      },
      (err) => setLocError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Lanterna
  const toggleFlashlight = useCallback(async () => {
    try {
      if (flashlightOn && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setFlashlightOn(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const track = stream.getVideoTracks()[0];
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        streamRef.current = stream;
        setFlashlightOn(true);
      }
    } catch {
      // Lanterna não suportada neste dispositivo
    }
  }, [flashlightOn]);

  const calibrate = () => {
    setCalibrating(true);
    playDiscoverSound();
    setTimeout(() => setCalibrating(false), 2000);
  };

  const copyCoords = () => {
    if (!location) return;
    const text = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentHeading = heading ?? 0;
  const sun = location ? getSunPosition(location.lat, location.lng) : null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-heading text-3xl sm:text-4xl tracking-widest uppercase text-foreground">
            <span className="text-gradient-survival">Bússola</span> Tática
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Navegação precisa com todas as ferramentas de orientação
          </p>
          {user && (
            <p className="text-xs text-muted-foreground mt-1">
              Logado como <span className="text-primary">{user.name}</span>
            </p>
          )}
        </motion.div>

        {/* Bússola principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex flex-col items-center mb-8"
        >
          <div className="relative w-72 h-72 sm:w-80 sm:h-80">
            {/* Anel exterior */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 shadow-[0_0_40px_rgba(var(--primary-rgb,245,158,11),0.2)]" />

            {/* Rosa dos ventos rotaciona */}
            <motion.div
              className="absolute inset-2 rounded-full bg-card border-2 border-border"
              style={{ rotate: -currentHeading }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            >
              {/* Marcações de grau */}
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1/2 top-0 origin-bottom"
                  style={{
                    height: "50%",
                    transform: `rotate(${i * 5}deg)`,
                  }}
                >
                  <div
                    className={`w-px mx-auto ${
                      i % 18 === 0
                        ? "h-4 bg-primary w-0.5"
                        : i % 6 === 0
                        ? "h-3 bg-foreground/60"
                        : "h-2 bg-foreground/20"
                    }`}
                  />
                </div>
              ))}

              {/* Pontos cardeais */}
              {[
                { label: "N", deg: 0, color: "text-destructive font-bold" },
                { label: "L", deg: 90, color: "text-foreground" },
                { label: "S", deg: 180, color: "text-foreground" },
                { label: "O", deg: 270, color: "text-foreground" },
              ].map((p) => (
                <div
                  key={p.label}
                  className="absolute left-1/2 top-0 origin-bottom"
                  style={{ height: "50%", transform: `rotate(${p.deg}deg)` }}
                >
                  <span
                    className={`absolute -top-1 left-1/2 -translate-x-1/2 text-sm font-heading ${p.color}`}
                    style={{ transform: `rotate(${-p.deg + currentHeading}deg)` }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}

              {/* Pontos intercardinais */}
              {[
                { label: "NE", deg: 45 },
                { label: "SE", deg: 135 },
                { label: "SO", deg: 225 },
                { label: "NO", deg: 315 },
              ].map((p) => (
                <div
                  key={p.label}
                  className="absolute left-1/2 top-0 origin-bottom"
                  style={{ height: "50%", transform: `rotate(${p.deg}deg)` }}
                >
                  <span
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-heading"
                    style={{ transform: `rotate(${-p.deg + currentHeading}deg)` }}
                  >
                    {p.label}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Agulha fixa (aponta para cima) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative h-[55%]">
                <Navigation className="w-10 h-10 text-primary drop-shadow-lg" />
              </div>
            </div>

            {/* Centro */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="w-16 h-16 rounded-full bg-background border-2 border-primary/50 flex flex-col items-center justify-center">
                <span className="text-lg font-heading text-primary">{currentHeading}°</span>
                <span className="text-[10px] text-muted-foreground font-heading">{getCardinal(currentHeading)}</span>
              </div>
            </div>

            {/* Indicador de calibração */}
            <AnimatePresence>
              {calibrating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center z-30"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <RotateCcw className="w-10 h-10 text-primary" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Aviso */}
          {compassError && (
            <div className="mt-4 flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              {compassError}
            </div>
          )}
        </motion.div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <Button onClick={calibrate} variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Calibrar
          </Button>
          <Button onClick={toggleFlashlight} variant={flashlightOn ? "default" : "outline"} size="sm" className="gap-2">
            <Flashlight className="w-4 h-4" />
            {flashlightOn ? "Desligar" : "Lanterna"}
          </Button>
          <Button onClick={copyCoords} variant="outline" size="sm" className="gap-2" disabled={!location}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar Coords"}
          </Button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Localização */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {location ? (
                <>
                  <p className="text-foreground font-mono text-xs">
                    {toDMS(location.lat, true)} {toDMS(location.lng, false)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Decimal: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Precisão: ±{location.accuracy.toFixed(0)}m
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">
                  {locError || "Obtendo localização..."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Altitude */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                <Mountain className="w-4 h-4 text-primary" />
                Altitude
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {location?.alt != null ? (
                <p className="text-2xl font-heading text-foreground">
                  {location.alt.toFixed(0)}<span className="text-sm text-muted-foreground ml-1">m</span>
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">Não disponível</p>
              )}
            </CardContent>
          </Card>

          {/* Velocidade */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                <Wind className="w-4 h-4 text-primary" />
                Velocidade
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {speed != null && speed > 0 ? (
                <p className="text-2xl font-heading text-foreground">
                  {(speed * 3.6).toFixed(1)}<span className="text-sm text-muted-foreground ml-1">km/h</span>
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">Parado</p>
              )}
            </CardContent>
          </Card>

          {/* Heading */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary" />
                Direção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-heading text-foreground">
                {currentHeading}°<span className="text-sm text-primary ml-2">{getCardinal(currentHeading)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Sol */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                {sun?.isDay ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
                Posição Solar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {sun ? (
                <>
                  <p className="text-foreground">
                    Altitude: <span className="font-mono">{sun.altitude.toFixed(1)}°</span>
                  </p>
                  <p className="text-foreground">
                    Azimute: <span className="font-mono">{sun.azimuth.toFixed(1)}°</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {sun.isDay ? "☀️ Dia" : "🌙 Noite"}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">Necessita localização</p>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading tracking-wider flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${heading !== null && !compassError?.includes("demonstração") ? "bg-green-500" : "bg-yellow-500"}`} />
                <span className="text-foreground">Bússola</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${location ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-foreground">GPS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${flashlightOn ? "bg-green-500" : "bg-muted"}`} />
                <span className="text-foreground">Lanterna</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dicas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-card border border-border rounded-xl p-6"
        >
          <h2 className="font-heading text-lg tracking-wider text-foreground mb-3">
            💡 Dicas de Navegação
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong className="text-foreground">Calibrar:</strong> Mova o celular em forma de 8 para melhorar a precisão</li>
            <li>• <strong className="text-foreground">Norte verdadeiro:</strong> A bússola aponta para o norte magnético — considere a declinação local</li>
            <li>• <strong className="text-foreground">Orientação pelo sol:</strong> O sol nasce no leste (~90°) e se põe no oeste (~270°)</li>
            <li>• <strong className="text-foreground">Sem bússola?</strong> Use um galho vertical e marque a sombra a cada 15min para achar leste-oeste</li>
            <li>• <strong className="text-foreground">À noite:</strong> A Estrela Polar (Polaris) indica o norte no hemisfério norte</li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Bussola;
