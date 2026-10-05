import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MessageSquare, ThumbsUp, Send, User, Clock, Trash2, Trophy, Crown, Medal, Award, Map, ExternalLink, Heart } from "lucide-react";
import SEO from "@/components/SEO";

const TIKTOK_URL = "https://www.tiktok.com/@centro.de.sobrevi?_r=1&_t=ZS-9AI03G3qnrg";

// TikTok logo as inline SVG (lucide-react doesn't ship a TikTok icon)
const TikTokIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.84c.298 0 .594.046.878.138V9.3a6.337 6.337 0 0 0-1-.08A6.34 6.34 0 0 0 3 20.27a6.34 6.34 0 0 0 10.92-4.33V8.69a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.1-.12z" />
  </svg>
);

interface ForumPost {
  id: string;
  author: string;
  content: string;
  category: string;
  likes: number;
  replies: ForumReply[];
  createdAt: string;
}

interface ForumReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

const CATEGORIES = ["Geral", "Equipamentos", "Bushcraft", "Relatos", "Dúvidas", "Dicas"];

const STORAGE_KEY = "sh_forum_posts";

const defaultPosts: ForumPost[] = [
  { id: "1", author: "Explorador_Silva", content: "Alguém já testou o filtro LifeStraw em águas turvas? Quero saber se funciona bem em rios com sedimento.", category: "Equipamentos", likes: 12, replies: [{ id: "r1", author: "Bushcraft_Ana", content: "Sim! Usei no Rio Amazonas e funcionou perfeitamente. Recomendo demais.", createdAt: new Date(Date.now() - 3600000).toISOString() }], createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "2", author: "Sobrevivente_Pedro", content: "Dica: sempre carregue um pederneira no kit. Fósforos e isqueiros podem falhar com umidade, mas a pederneira nunca te abandona.", category: "Dicas", likes: 24, replies: [], createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "3", author: "Trilheira_Maria", content: "Fiz minha primeira trilha solo de 3 dias na Serra da Mantiqueira! Foi desafiador mas incrível. Compartilho mais detalhes se alguém tiver interesse.", category: "Relatos", likes: 31, replies: [{ id: "r2", author: "Aventureiro_Carlos", content: "Conta mais! Que equipamento levou?", createdAt: new Date(Date.now() - 7200000).toISOString() }, { id: "r3", author: "Trilheira_Maria", content: "Levei mochila 45L, barraca ultralight, fogareiro e kit de primeiros socorros. O essencial!", createdAt: new Date(Date.now() - 3600000).toISOString() }], createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "4", author: "Bushcraft_João", content: "Como identificar se uma planta é comestível na natureza? Sei que existe o teste universal de comestibilidade, mas queria dicas práticas.", category: "Dúvidas", likes: 18, replies: [], createdAt: new Date(Date.now() - 345600000).toISOString() },
];

function loadPosts(): ForumPost[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : defaultPosts; } catch { return defaultPosts; }
}

const MOCK_LEADERBOARD = [
  { name: "Trilheira_Maria", xp: 4250, level: 9, achievements: 7, avatar: "🏔️" },
  { name: "Bushcraft_João", xp: 3800, level: 8, achievements: 6, avatar: "🌿" },
  { name: "Explorador_Silva", xp: 3100, level: 7, achievements: 5, avatar: "🧭" },
  { name: "Sobrevivente_Pedro", xp: 2600, level: 6, achievements: 4, avatar: "🔥" },
  { name: "Bushcraft_Ana", xp: 2100, level: 5, achievements: 4, avatar: "🏕️" },
  { name: "Aventureiro_Carlos", xp: 1500, level: 4, achievements: 3, avatar: "⛰️" },
  { name: "Rastreador_Lucas", xp: 900, level: 2, achievements: 2, avatar: "🐾" },
  { name: "Novato_Rafael", xp: 350, level: 1, achievements: 1, avatar: "🌱" },
];

const MOCK_MAP_RANKING = [
  { name: "Trilheira_Maria", pointsDiscovered: 18, avatar: "🏔️" },
  { name: "Explorador_Silva", pointsDiscovered: 15, avatar: "🧭" },
  { name: "Bushcraft_João", pointsDiscovered: 12, avatar: "🌿" },
  { name: "Sobrevivente_Pedro", pointsDiscovered: 9, avatar: "🔥" },
  { name: "Bushcraft_Ana", pointsDiscovered: 7, avatar: "🏕️" },
  { name: "Aventureiro_Carlos", pointsDiscovered: 4, avatar: "⛰️" },
  { name: "Rastreador_Lucas", pointsDiscovered: 2, avatar: "🐾" },
  { name: "Novato_Rafael", pointsDiscovered: 0, avatar: "🌱" },
];

const RANK_ICONS = [Crown, Medal, Award];

const Comunidade = () => {
  const [posts, setPosts] = useState<ForumPost[]>(loadPosts);
  const [selectedCategory, setSelectedCategory] = useState("Geral");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Geral");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [showMapRanking, setShowMapRanking] = useState(false);
  const { profile } = useUserProfile();

  // Map ranking with user
  const mapAchievementIds = ["map-first", "map-5", "map-explorer", "map-water-expert", "map-danger-master", "map-waypoint", "map-event-survivor"];
  const userMapPoints = profile.achievements.filter((a) => mapAchievementIds.includes(a.id)).length * 3; // estimate
  const mapRanking = [...MOCK_MAP_RANKING, { name: profile.name, pointsDiscovered: userMapPoints, avatar: "👤" }]
    .sort((a, b) => b.pointsDiscovered - a.pointsDiscovered)
    .slice(0, 10);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }, [posts]);

  // Merge user into leaderboard
  const leaderboard = [...MOCK_LEADERBOARD, { name: profile.name, xp: profile.xp, level: profile.level, achievements: profile.achievements.length, avatar: "👤" }]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 10);

  const filtered = selectedCategory === "Geral" ? posts : posts.filter((p) => p.category === selectedCategory);

  const createPost = () => {
    if (!newContent.trim()) return;
    const post: ForumPost = { id: `p-${Date.now()}`, author: "Você", content: newContent, category: newCategory, likes: 0, replies: [], createdAt: new Date().toISOString() };
    setPosts([post, ...posts]);
    setNewContent("");
  };

  const addReply = (postId: string) => {
    if (!replyContent.trim()) return;
    const reply: ForumReply = { id: `r-${Date.now()}`, author: "Você", content: replyContent, createdAt: new Date().toISOString() };
    setPosts(posts.map((p) => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p));
    setReplyContent("");
    setReplyingTo(null);
  };

  const likePost = (postId: string) => {
    setPosts(posts.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  };

  const deletePost = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <Layout>
      <SEO title="Comunidade — Fórum e Ranking" description="Conecte-se com outros sobreviventes, compartilhe experiências e suba no ranking de XP." />
      <Section title="Comunidade" subtitle="Troque experiências com outros sobreviventes">
        {/* TikTok Follow Banner */}
        <motion.a
          href={TIKTOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="group relative block overflow-hidden rounded-2xl mb-8 border border-white/10"
          style={{
            background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
          }}
        >
          {/* Glow accents */}
          <div
            className="pointer-events-none absolute -top-16 -right-10 w-48 h-48 rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-500"
            style={{ background: "#FE2C55" }}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-10 w-48 h-48 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"
            style={{ background: "#25F4EE" }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col sm:flex-row items-center gap-5 p-5 sm:p-6">
            {/* Avatar/icon block */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #FE2C55 0%, #25F4EE 100%)",
                  boxShadow: "0 0 30px rgba(254, 44, 85, 0.5), 0 0 60px rgba(37, 244, 238, 0.3)",
                }}
              >
                <TikTokIcon size={36} className="text-white" />
              </div>
            </div>

            {/* Text content */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="font-heading text-base sm:text-lg tracking-wider text-white">
                  Siga no TikTok
                </h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "#FE2C55", color: "#fff" }}
                >
                  Ao vivo
                </span>
              </div>
              <p className="text-sm text-white/80 mb-1">
                Dicas rápidas de sobrevivência, bushcraft e equipamentos em vídeo.
              </p>
              <p className="text-sm font-medium text-white/90 truncate">
                @centro.de.sobrevi
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <span
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-black transition-transform group-hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #25F4EE 0%, #ffffff 100%)",
                  boxShadow: "0 8px 24px rgba(37, 244, 238, 0.35)",
                }}
              >
                <Heart size={16} className="fill-black" />
                Seguir agora
                <ExternalLink size={14} />
              </span>
            </div>
          </div>
        </motion.a>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-gradient-card rounded-xl border border-border p-5 mb-8">
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="flex items-center gap-2 w-full">
            <Trophy size={20} className="text-primary" />
            <h3 className="font-heading text-lg text-foreground tracking-wider flex-1 text-left">Ranking de Sobreviventes</h3>
            <span className="text-xs text-muted-foreground">{showLeaderboard ? "Ocultar" : "Mostrar"}</span>
          </button>
          {showLeaderboard && (
            <div className="mt-4 space-y-2">
              {leaderboard.map((user, i) => {
                const isUser = user.name === profile.name;
                const RankIcon = RANK_ICONS[i] || null;
                return (
                  <motion.div key={user.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isUser ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50"}`}>
                    <span className={`w-7 text-center font-heading text-sm ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {RankIcon ? <RankIcon size={18} className="mx-auto" /> : `#${i + 1}`}
                    </span>
                    <span className="text-lg">{user.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                        {user.name} {isUser && <span className="text-xs text-primary/70">(você)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Nível {user.level} · {user.achievements} conquistas</p>
                    </div>
                    <span className="font-heading text-sm text-primary whitespace-nowrap">{user.xp.toLocaleString()} XP</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map Ranking */}
        <div className="bg-gradient-card rounded-xl border border-border p-5 mb-8">
          <button onClick={() => setShowMapRanking(!showMapRanking)} className="flex items-center gap-2 w-full">
            <Map size={20} className="text-primary" />
            <h3 className="font-heading text-lg text-foreground tracking-wider flex-1 text-left">Ranking do Mapa</h3>
            <span className="text-xs text-muted-foreground">{showMapRanking ? "Ocultar" : "Mostrar"}</span>
          </button>
          {showMapRanking && (
            <div className="mt-4 space-y-2">
              {mapRanking.map((user, i) => {
                const isUser = user.name === profile.name;
                const RankIcon = RANK_ICONS[i] || null;
                return (
                  <motion.div key={user.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isUser ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50"}`}>
                    <span className={`w-7 text-center font-heading text-sm ${i < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      {RankIcon ? <RankIcon size={18} className="mx-auto" /> : `#${i + 1}`}
                    </span>
                    <span className="text-lg">{user.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isUser ? "text-primary" : "text-foreground"}`}>
                        {user.name} {isUser && <span className="text-xs text-primary/70">(você)</span>}
                      </p>
                    </div>
                    <span className="font-heading text-sm text-primary whitespace-nowrap">{user.pointsDiscovered} pontos</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gradient-card rounded-lg border border-border p-4 mb-8">
          <h3 className="font-heading text-sm text-foreground tracking-wider mb-3">Nova Publicação</h3>
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Compartilhe sua experiência, dúvida ou dica..."
            className="w-full bg-background border border-input rounded-md p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring" />
          <div className="flex items-center justify-between mt-3">
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground">
              {CATEGORIES.filter((c) => c !== "Geral").map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button size="sm" onClick={createPost} className="gap-2"><Send size={14} /> Publicar</Button>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filtered.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}
              className="bg-gradient-card rounded-lg border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center"><User size={16} className="text-primary" /></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock size={10} /> {timeAgo(post.createdAt)}
                      <span className="bg-muted px-2 py-0.5 rounded-full">{post.category}</span>
                    </div>
                  </div>
                </div>
                {post.author === "Você" && (
                  <Button variant="ghost" size="icon" onClick={() => deletePost(post.id)}><Trash2 size={14} className="text-destructive" /></Button>
                )}
              </div>
              <p className="text-sm text-foreground/90 mb-4">{post.content}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => likePost(post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <ThumbsUp size={14} /> {post.likes}
                </button>
                <button onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                  <MessageSquare size={14} /> {post.replies.length} respostas
                </button>
              </div>

              {/* Replies */}
              {post.replies.length > 0 && (
                <div className="mt-4 ml-4 border-l-2 border-border pl-4 space-y-3">
                  {post.replies.map((r) => (
                    <div key={r.id} className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{r.author}</span>
                        <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                      </div>
                      <p className="text-foreground/80">{r.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === post.id && (
                <div className="mt-4 flex gap-2">
                  <Input value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Escreva uma resposta..." className="flex-1" />
                  <Button size="sm" onClick={() => addReply(post.id)}><Send size={14} /></Button>
                </div>
              )}
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma publicação nesta categoria.</p>}
        </div>
      </Section>
    </Layout>
  );
};

export default Comunidade;
