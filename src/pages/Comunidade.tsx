import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Section from "@/components/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Send, User, Clock, Trash2 } from "lucide-react";

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

const Comunidade = () => {
  const [posts, setPosts] = useState<ForumPost[]>(loadPosts);
  const [selectedCategory, setSelectedCategory] = useState("Geral");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Geral");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(posts)); }, [posts]);

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
      <Section title="Comunidade" subtitle="Troque experiências com outros sobreviventes">
        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* New post */}
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
