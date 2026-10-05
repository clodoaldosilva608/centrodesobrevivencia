// Centralized course data — shared by Cursos.tsx (listing) and CursoDetalhe.tsx (detail)
// To add a new course: append to COURSES array; the sitemap script will pick it up automatically.

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Long-form description shown on the detail page (max ~600 chars). */
  longDescription?: string;
  image: string;
  /** Optional secondary atmospheric image for the detail page hero. */
  atmosphericImage?: string;
  category: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  modules: number;
  hours: number;
  lessons: string[];
  /** What you'll learn — bullet list of takeaways shown on detail page. */
  learn?: string[];
  /** Prerequisites — what the student should know before enrolling. */
  prerequisites?: string[];
  /** Target audience — who this course is for. */
  audience?: string;
  /** Mock instructor name. */
  instructor?: string;
  featured?: boolean;
}

export const COURSES: Course[] = [
  {
    id: "essencial-sobrevivencia",
    title: "Essencial de Sobrevivência",
    subtitle: "O ponto de partida para todo sobrevivente",
    description:
      "Curso introdutório completo cobrindo os 5 pilares: água, fogo, abrigo, comida e resgate. Você sai com clareza do que fazer primeiro em qualquer situação de risco, das primeiras 24 horas até o resgate.",
    longDescription:
      "Este é o curso fundador do Centro de Sobrevivência. A partir da Regra do 3 (3 minutos sem ar, 3 horas sem abrigo, 3 dias sem água, 3 semanas sem comida), você constrói um plano de ação mental que pode ser executado em qualquer cenário — floresta, cidade, montanha, litoral. Cada lição vem com checklist imprimível, vídeo demonstrativo e exercício prático progressivo.",
    image: "/cursos/curso-essencial-sobrevivencia.webp",
    atmosphericImage: "/cursos/curso-fogo-noite.webp",
    category: "Fundamentos",
    level: "Iniciante",
    modules: 6,
    hours: 8,
    lessons: ["A regra do 3", "Avaliação de cena", "Kit pessoal mínimo", "Plano de resgate", "Sinalização", "Psicologia do pânico"],
    learn: [
      "Aplicar a Regra do 3 em qualquer cenário",
      "Avaliar uma cena de emergência em menos de 60 segundos",
      "Montar um kit pessoal mínimo (PAW — Personal Alert Wallet)",
      "Estabelecer prioridades nas primeiras 24 horas",
      "Sinalizar para equipe de resgate (visual e sonoro)",
      "Reconhecer e controlar os 5 estágios do pânico",
    ],
    prerequisites: ["Nenhum — este é o ponto de partida."],
    audience: "Iniciantes, aventureiros de fim de semana, trabalhadores remotos, motoristas de longa distância.",
    instructor: "Carlos Mendes",
    featured: true,
  },
  {
    id: "purificacao-agua",
    title: "Purificação de Água na Natureza",
    subtitle: "Sem água você tem 3 dias. Aprenda a nunca ficar sem.",
    description:
      "Da coleta em rios turvos à destilação solar, este curso cobre todos os métodos de tratamento de água em campo. Inclui uso de filtros portáteis (LifeStraw, Sawyer), fervura eficiente, pastilhas cloradoras e destilação improvisada.",
    longDescription:
      "Água contaminada mata mais sobreviventes do que fome ou frio. Neste curso você aprende a identificar fontes seguras, avaliar turbidez, escolher o método de tratamento certo para cada situação e manter o equipimento em campo. Inclui protocolo de emergência para quando você não tem filtro nem pastilha.",
    image: "/cursos/curso-purificacao-agua.webp",
    category: "Água",
    level: "Iniciante",
    modules: 5,
    hours: 6,
    lessons: ["Fontes seguras vs. contaminadas", "Filtro portátil passo a passo", "Fervura eficiente", "Pastilhas e cloro", "Destilação solar improvisada"],
    learn: [
      "Identificar fontes seguras e contaminadas a olho nu",
      "Operar filtros portáteis (LifeStraw, Sawyer, Katadyn)",
      "Calcular tempo e temperatura de fervura por altitude",
      "Usar pastilhas cloradoras e iodo corretamente",
      "Construir destilador solar improvisado com materiais de campo",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência' ou tem conhecimento equivalente."],
    audience: "Aventureiros, expedicionários, bug-out-preppers, trabalhadores remotos em regiões sem água tratada.",
    instructor: "Marcos Silva",
  },
  {
    id: "fundamentos-bushcraft",
    title: "Fundamentos de Bushcraft",
    subtitle: "Viver com o que a floresta oferece",
    description:
      "O bushcraft não é só sobreviver — é habitar a natureza com habilidade. Este curso conecta os fundamentos do sobrevivencialismo com técnicas de bushcraft: fogo por atrito, abrigos de longa duração, ferramentas e cordoaria natural.",
    longDescription:
      "Bushcraft é a arte de habitar a natureza com habilidade e simplicidade. Diferente do sobrevivencialismo (que é reativo e de emergência), o bushcraft é proativo e de longo prazo. Neste curso você transita do sobreviver para o florescer em campo: fogo por atrito, abrigos que duram semanas, cordoaria natural, processamento de lenha com faca fixa e higiene de campo prolongada.",
    image: "/cursos/curso-fundamentos-bushcraft.webp",
    atmosphericImage: "/cursos/curso-fogo-noite.webp",
    category: "Bushcraft",
    level: "Intermediário",
    modules: 7,
    hours: 10,
    lessons: ["Bow drill (fogo por atrito)", "Abrigo de longa duração", "Cordoaria natural", "Uso seguro de faca", "Processamento de lenha", "Fogueira tipológica", "Higiene de campo"],
    learn: [
      "Acender fogo por atrito com bow drill",
      "Construir abrigo de longa duração (semanas)",
      "Produzir corda a partir de fibras naturais",
      "Usar faca fixa com segurança (4 grips principais)",
      "Processar lenha para fogueira tipológica",
      "Manter higiene pessoal em campo por dias",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência'."],
    audience: "Acampadores experientes, trilheiros, instrutores de escoteiros, bushcrafters iniciantes.",
    instructor: "Ana Ribeiro",
  },
  {
    id: "navegacao-trilha",
    title: "Navegação e Trilha",
    subtitle: "Não se perca mais. Aprenda a ler o terreno.",
    description:
      "Navegação clássica com bússola e mapa topográfico, leitura de relevo, rumo reverso, intersecção de rumos e triangulação. Inclui navegação solar, pelo relevo e uso de GPS offline em emergência.",
    longDescription:
      "A maioria dos resgates em trilha acontece por erro de navegação, não por lesão. Neste curso você domina navegação clássica com bússola e mapa topográfico (não depende de bateria), além de navegação solar e por relevo como fallback. GPS offline é incluído, mas tratado como complemento, não solução principal.",
    image: "/cursos/curso-navegacao-trilha.webp",
    category: "Navegação",
    level: "Intermediário",
    modules: 6,
    hours: 9,
    lessons: ["Leitura de mapa topográfico", "Bússola: rumo e azimute", "Triangulação", "Navegação solar", "Navegação por relevo", "GPS offline e waypoints"],
    learn: [
      "Ler curvas de nível e símbolos de mapa topográfico",
      "Calcular azimute e converter rumo reverso",
      "Triangular sua posição com 2 ou 3 pontos de referência",
      "Navegar pelo sol durante o dia",
      "Navegar por relevo (cristas, vales, drenos)",
      "Usar GPS offline (OsmAnd, Gaia) e criar waypoints",
    ],
    prerequisites: ["Familiaridade básica com trilhas de um dia."],
    audience: "Trilheiros, montanhistas, expedicionários, guias amador.",
    instructor: "Pedro Alves",
  },
  {
    id: "equipamentos-essenciais",
    title: "Equipamentos Essenciais",
    subtitle: "O gear certo pode salvar sua vida — saiba escolher",
    description:
      "Como montar seu kit de sobrevivência modular sem peso morto. Comparativo de mochilas, facas, filtros, lampiões, multisplash, roupas e calçados. Inclui checklist imprimível e guia de manutenção de campo.",
    longDescription:
      "Existem centenas de equipamentos de sobrevivência no mercado — 80% são marketing, 20% são essenciais. Este curso ensina a separar o útil do supérfluo, montando um kit modular que atende cenários de 1h a 72h. Inclui comparativo de marcas, faixas de preço, peso e manutenção preventiva.",
    image: "/cursos/curso-equipamentos-essenciais.webp",
    category: "Equipamentos",
    level: "Iniciante",
    modules: 5,
    hours: 7,
    lessons: ["Filosofia do kit modular", "Escolha de faca fixa", "Mochila ergonométrica", "Lanterna e lampião", "Manutenção e lubrificação"],
    learn: [
      "Aplicar a filosofia do kit modular (camada base + extensões)",
      "Escolher faca fixa com lâmina entre 9-12cm, aço carbono",
      "Avaliar mochila por ergonomia, fita de quadril e volume",
      "Diferenciar lanterna (foco) de lampião (ambiente)",
      "Lubrificar e afiar ferramentas em campo",
    ],
    prerequisites: ["Nenhum."],
    audience: "Iniciantes em camping, bug-out-preppers, compradores de gear.",
    instructor: "Carlos Mendes",
  },
  {
    id: "mente-forte",
    title: "Mente Forte: Psicologia da Sobrevivência",
    subtitle: "O corpo segue a mente. Treine a sua.",
    description:
      "Estudos militares mostram que 80% das mortes em situações de sobrevivência são causadas por pânico, não por falta de recursos. Este curso aborda concentração, controle de respiração, tomada de decisão sob estresse e resiliência emocional.",
    longDescription:
      "Em 1994, um estudo militar revisitado pelo US Army SERE mostrou que 80% das baixas em situações de sobrevivência foram causadas por pânico, má decisão ou colapso emocional — não por falta de água, abrigo ou resgate. Este curso treina a mente para permanecer funcional sob estresse extremo, usando técnicas validadas por forças especiais.",
    image: "/cursos/curso-mente-forte.webp",
    atmosphericImage: "/cursos/curso-fogo-noite.webp",
    category: "Mentalidade",
    level: "Avançado",
    modules: 4,
    hours: 5,
    lessons: ["Respiração tática 4-4-4-4", "Regra STOP", "Decisão sob estresse", "Resiliência emocional"],
    learn: [
      "Aplicar respiração tática box 4-4-4-4 em 60 segundos",
      "Executar a Regra STOP (Stop, Think, Observe, Plan)",
      "Tomar decisão sob estresse usando OODA loop",
      "Construir resiliência emocional com journaling de campo",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência'."],
    audience: "Sobrevivencialistas avançados, profissionais de emergência, atletas de aventura.",
    instructor: "Dra. Juliana Costa",
  },
  {
    id: "acampamento-autonomo",
    title: "Acampamento Autônomo",
    subtitle: "Passe 72h sozinho em campo — e goste",
    description:
      "Do select do local à desmontagem do acampamento, este curso coloca você em campo por 72 horas simuladas com gear mínimo. Inclui setup noturno, gerenciamento de bateria, sono reparador em campo e higiene prolongada.",
    longDescription:
      "Este é o curso mais hands-on do catálogo. Durante 72 horas simuladas (em campo real ou em cenário virtual), você executa setup noturno, gestão de bateria de devices, sono reparador em temperatura extrema, higiene prolongada e desmontagem sem deixar rastro. O curso termina com auto-avaliação e plano de melhoria.",
    image: "/cursos/curso-acampamento-autonomo.webp",
    category: "Campo",
    level: "Avançado",
    modules: 6,
    hours: 12,
    lessons: ["Seleção de local", "Setup noturno", "Sonífero natural", "Gestão de bateria", "Higiene prolongada", "Desmontagem sem rastro"],
    learn: [
      "Selecionar local seguro (dreno, vento, água, animais)",
      "Montar acampamento noturno em menos de 30 minutos",
      "Dormir reparadoramente em campo (técnicas de sonífero natural)",
      "Gerir bateria de devices em campo (power bank, solar, economia)",
      "Manter higiene pessoal por 72h+ sem banheiro",
      "Desmontar acampamento sem deixar rastro (Leave No Trace)",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência' e 'Equipamentos Essenciais'."],
    audience: "Acampadores experientes, sobrevivencialistas, bug-out-preppers.",
    instructor: "Pedro Alves",
  },
  {
    id: "dominio-do-fogo",
    title: "Domínio do Fogo",
    subtitle: "Da pederneira ao fogo de longa duração",
    description:
      "Tudo sobre fogo em condições adversas: pederneira (ferro-cério), isqueiros sob chuva, fogo por atrito (bow drill e hand drill), fogueiras tipológicas, manutenção noturna e extinção segura. Inclui prática com tinder úmido.",
    longDescription:
      "Fogo é a primeira tecnologia humana — e a mais crítica em sobrevivência. Este curso domina todas as formas de acender, manter e extinguir fogo em condições adversas (chuva, vento, umidade). Você aprende pederneira avançada, bow drill, hand drill, tipologia de fogueira (teepee, log cabin, lean-to, star) e extinção segura sem deixar brasa.",
    image: "/cursos/curso-dominio-do-fogo.webp",
    atmosphericImage: "/cursos/curso-fogo-noite.webp",
    category: "Fogo",
    level: "Intermediário",
    modules: 5,
    hours: 8,
    lessons: ["Pederneira avançada", "Tinder úmido", "Bow drill", "Hand drill", "Fogo de longa duração"],
    learn: [
      "Usar pederneira (ferro-cério) com técnica de escova",
      "Encontrar e preparar tinder úmido (birch, resin, fatwood)",
      "Acender fogo por atrito com bow drill",
      "Acender fogo por atrito com hand drill",
      "Manter fogueira acesa por 8h+ sem reaprovisionamento",
      "Extinguir fogo sem deixar brasa (regra de mão)",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência'."],
    audience: "Acampadores, bushcrafters, sobrevivencialistas intermediários.",
    instructor: "Carlos Mendes",
  },
  {
    id: "defesa-pessoal",
    title: "Defesa Pessoal e Combate Corpo a Corpo",
    subtitle: "Técnicas reais para o mundo real — não ringue",
    description:
      "Curso prático de autodefesa focado em situações reais de risco: golpes de imobilização, defesa contra agressores armados, projeções, finalizações e condicionamento físico específico. Inclui disciplina mental e protocolo de fuga antes de confronto.",
    longDescription:
      "Defesa pessoal real não é MMA — não há juiz, rounds ou tapete. Este curso ensina protocolo de fuga antes de confronto, técnicas de imobilização rápida para criar distância, defesa contra faca e arma de fogo curto, projeções e finalizações. Inclui condicionamento físico específico e treino mental sob estresse.",
    image: "/cursos/curso-defesa-pessoal.webp",
    category: "Combate",
    level: "Avançado",
    modules: 6,
    hours: 12,
    lessons: ["Golpes e defesa base", "Defesa contra faca", "Projeções", "Finalizações", "Condicionamento físico", "Protocolo de fuga"],
    learn: [
      "Aplicar protocolo de fuga antes de confronto (Awareness Color Code)",
      "Executar defesa base contra agressor desarmado",
      "Defender contra faca (5 ângulos principais)",
      "Aplicar 3 projeções de controle",
      "Finalizar com chave de braço e triângulo",
      "Manter condicionamento físico específico para defesa",
    ],
    prerequisites: ["Adultos maiores de 18 anos. Aptidão física básica."],
    audience: "Adultos interessados em autodefesa, profissionais de segurança, mulheres vulneráveis.",
    instructor: "Bruno Tático (ex-combatente)",
  },
  {
    id: "construcao-abrigos",
    title: "Construção de Abrigos Naturais",
    subtitle: "Proteção, conforto e segurança em qualquer clima",
    description:
      "Aprenda a montar abrigos eficazes com materiais do terreno e lona: tarp, A-frame, cabana de galhos, abrigo iglu/ninja e Debris Hut. Inclui seleção de local, isolamento térmico do solo, impermeabilização e ventilação para fogueira interna.",
    longDescription:
      "Sem abrigo, você perde calor 3x mais rápido. Este curso cobre 5 tipos de abrigo para cenários distintos — do abrigo de emergência em 5 minutos com tarp ao abrigo de longa duração tipo Debris Hut (que pode manter você aquecido a -10°C sem fogueira). Inclui seleção de local, isolamento térmico do solo e ventilação para fogueira interna segura.",
    image: "/cursos/curso-construcao-abrigos.webp",
    category: "Abrigo",
    level: "Intermediário",
    modules: 6,
    hours: 9,
    lessons: ["Seleção de local", "Tarp e A-frame", "Cabana de galhos", "Debris Hut", "Iglu ninja", "Fogueira interna segura"],
    learn: [
      "Selecionar local de abrigo (dreno, vento, animais, água)",
      "Montar abrigo tarp em A-frame (5 minutos)",
      "Construir cabana de galhos (1-2 horas)",
      "Construir Debris Hut (mantém aquecido a -10°C sem fogo)",
      "Construir abrigo iglu/ninja com neve",
      "Configurar fogueira interna com ventilação segura (Dakota fire hole)",
    ],
    prerequisites: ["Concluiu 'Essencial de Sobrevivência'."],
    audience: "Acampadores, bushcrafters, sobrevivencialistas intermediários.",
    instructor: "Ana Ribeiro",
  },
  {
    id: "bug-out-bag",
    title: "Montagem de Bug Out Bag (BOB)",
    subtitle: "Seu kit de emergência para sair do imprevisto",
    description:
      "Como montar um BOB completo e leve: água, alimentação, abrigo, roupa, primeiros socorros, ferramentas, navegação, higiene, comunicação, luz e documentos. Inclui checklist imprimível e princípios de priorização por cenário.",
    longDescription:
      "Bug Out Bag é o kit de 72 horas que você agarra quando precisa sair de casa imprevistamente (incêndio, enchente, despejo, conflito). Este curso ensina a montar um BOB por categorias, priorizando por cenário (urbano vs. floresta, frio vs. quente) e calibrando peso entre 8-15kg. Inclui checklist imprimível e simulado de bug-out em 5 minutos.",
    image: "/cursos/curso-bug-out-bag.webp",
    category: "Equipamentos",
    level: "Iniciante",
    modules: 5,
    hours: 6,
    lessons: ["Filosofia do BOB", "Água e alimentação", "Primeiros socorros", "Ferramentas e navegação", "Documentos e comunicação"],
    learn: [
      "Aplicar a filosofia do BOB (3 dias, 3 categorias, 3 pesos)",
      "Montar kit de água e alimentação para 72h",
      "Montar kit de primeiros socorros por cenário",
      "Escolher ferramentas e navegação sem peso morto",
      "Organizar documentos e comunicação (papel + digital)",
    ],
    prerequisites: ["Nenhum."],
    audience: "Famílias, bug-out-preppers, trabalhadores remotos, moradores de áreas de risco.",
    instructor: "Carlos Mendes",
  },
];

// Derived lists for filters
export const COURSE_CATEGORIES = [
  "Todos",
  "Fundamentos",
  "Água",
  "Bushcraft",
  "Navegação",
  "Equipamentos",
  "Mentalidade",
  "Campo",
  "Fogo",
  "Combate",
  "Abrigo",
];

export const COURSE_LEVELS = ["Todos", "Iniciante", "Intermediário", "Avançado"];

export const getCourseById = (id: string): Course | undefined =>
  COURSES.find((c) => c.id === id);

export const getFeaturedCourse = (): Course =>
  COURSES.find((c) => c.featured) ?? COURSES[0];

export const getRelatedCourses = (course: Course, limit = 3): Course[] =>
  COURSES.filter((c) => c.id !== course.id && c.category === course.category)
    .slice(0, limit)
    .concat(
      COURSES.filter((c) => c.id !== course.id && c.category !== course.category).slice(0, Math.max(0, limit - 3))
    )
    .slice(0, limit);
