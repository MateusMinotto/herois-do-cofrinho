import chapterBarter from "@/assets/chapter-barter.jpg";
import chapterCoins from "@/assets/chapter-coins.jpg";
import chapterDigital from "@/assets/chapter-digital.jpg";

export const child = {
  name: "Lara",
  avatar: "🦸‍♀️",
  level: 3,
  levelName: "Exploradora Financeira",
  nextLevelName: "Mestre da Economia",
  xp: 640,
  xpToNext: 1000,
  points: 245,
  pointValue: 0.5, // R$ por ponto
};

export const levels = [
  "Aprendiz",
  "Guardião das Moedas",
  "Explorador Financeiro",
  "Mestre da Economia",
  "Herói do Cofrinho",
];

export type TaskStatus = "todo" | "doing" | "done";
export interface Task {
  id: string;
  title: string;
  category: string;
  points: number;
  status: TaskStatus;
  frequency: "Única" | "Diária" | "Semanal" | "Mensal";
  due?: string;
  approved?: boolean;
}

export const tasks: Task[] = [
  { id: "1", title: "Ler a História do Dinheiro", category: "Educação Financeira", points: 30, status: "doing", frequency: "Única" },
  { id: "2", title: "Arrumar a cama", category: "Casa", points: 5, status: "done", frequency: "Diária", approved: true },
  { id: "3", title: "Fazer a lição de casa", category: "Estudos", points: 15, status: "todo", frequency: "Diária", due: "Hoje" },
  { id: "4", title: "Treino de futebol", category: "Esportes", points: 10, status: "doing", frequency: "Semanal" },
  { id: "5", title: "Ler 20 páginas", category: "Leitura", points: 12, status: "todo", frequency: "Diária" },
  { id: "6", title: "Organizar mochila", category: "Organização", points: 5, status: "done", frequency: "Diária", approved: false },
  { id: "7", title: "Beber 2L de água", category: "Saúde", points: 8, status: "todo", frequency: "Diária" },
  { id: "8", title: "Quiz Financeiro", category: "Educação Financeira", points: 25, status: "todo", frequency: "Única" },
];

export const categories = [
  { name: "Estudos", color: "bg-primary/15 text-primary", emoji: "📚" },
  { name: "Casa", color: "bg-success/15 text-success", emoji: "🏠" },
  { name: "Organização", color: "bg-secondary/15 text-secondary", emoji: "🗂️" },
  { name: "Saúde", color: "bg-fun/15 text-fun", emoji: "💧" },
  { name: "Esportes", color: "bg-warning/20 text-warning", emoji: "⚽" },
  { name: "Leitura", color: "bg-accent/30 text-accent-foreground", emoji: "📖" },
  { name: "Educação Financeira", color: "bg-coin/30 text-coin-foreground", emoji: "🪙" },
];

export const rewards = [
  { id: "r1", name: "1 hora de videogame", points: 50, status: "Ativo", emoji: "🎮" },
  { id: "r2", name: "Sorvete favorito", points: 80, status: "Solicitado", emoji: "🍦" },
  { id: "r3", name: "Cinema com amigos", points: 200, status: "Ativo", emoji: "🎬" },
  { id: "r4", name: "Brinquedo novo", points: 350, status: "Ativo", emoji: "🧸" },
  { id: "r5", name: "Pizza no jantar", points: 120, status: "Entregue", emoji: "🍕" },
];

export const goals = [
  { id: "g1", name: "Bicicleta nova", target: 800, current: 245, emoji: "🚲", due: "Dezembro" },
  { id: "g2", name: "Patins coloridos", target: 300, current: 180, emoji: "⛸️", due: "Outubro" },
  { id: "g3", name: "Livro de aventura", target: 80, current: 60, emoji: "📕", due: "Próx. semana" },
];

export const achievements = [
  { id: "a1", name: "Primeira Missão", desc: "Primeira tarefa concluída", emoji: "🎯", earned: true },
  { id: "a2", name: "Leitor Financeiro", desc: "Concluir História do Dinheiro", emoji: "📚", earned: true },
  { id: "a3", name: "Especialista em Dinheiro", desc: "100% no Quiz", emoji: "🧠", earned: false },
  { id: "a4", name: "Super Organizado", desc: "10 tarefas concluídas", emoji: "⭐", earned: true },
  { id: "a5", name: "Mestre da Rotina", desc: "50 tarefas concluídas", emoji: "🏆", earned: false },
  { id: "a6", name: "Guardião do Cofrinho", desc: "Primeira meta alcançada", emoji: "🐷", earned: false },
  { id: "a7", name: "Herói do Cofrinho", desc: "Nível máximo", emoji: "🦸", earned: false },
];

export const chapters = [
  { id: 1, title: "O Escambo", desc: "Como tudo começou: trocar para conseguir o que precisamos.", image: chapterBarter, progress: 100 },
  { id: 2, title: "As Primeiras Moedas", desc: "Quando o mundo inventou as moedas de metal.", image: chapterCoins, progress: 100 },
  { id: 3, title: "O Papel-Moeda", desc: "O nascimento das cédulas e do dinheiro de papel.", image: chapterCoins, progress: 60 },
  { id: 4, title: "Os Bancos", desc: "Onde guardamos e cuidamos do dinheiro.", image: chapterCoins, progress: 0 },
  { id: 5, title: "Cartões e Tecnologia", desc: "Como o plástico mudou as compras.", image: chapterDigital, progress: 0 },
  { id: 6, title: "Pix e Dinheiro Digital", desc: "O dinheiro que viaja na velocidade da luz.", image: chapterDigital, progress: 0 },
  { id: 7, title: "Como Economizar", desc: "Pequenos hábitos que fazem grandes diferenças.", image: chapterDigital, progress: 0 },
];

export const quiz = [
  {
    q: "O que era o escambo?",
    options: ["Pagar com moedas", "Trocar coisas por outras coisas", "Pagar com PIX", "Usar cartão de crédito"],
    correct: 1,
  },
  {
    q: "Para que serviam as primeiras moedas?",
    options: ["Decorar a casa", "Brincar", "Comprar e vender com mais facilidade", "Jogar fora"],
    correct: 2,
  },
  {
    q: "O que é o papel-moeda?",
    options: ["Um tipo de jornal", "Cédulas que valem dinheiro", "Papel comum", "Carta de banco"],
    correct: 1,
  },
  {
    q: "Para que servem os bancos?",
    options: ["Guardar brinquedos", "Guardar e cuidar do dinheiro", "Imprimir livros", "Vender pizzas"],
    correct: 1,
  },
  {
    q: "O que é o PIX?",
    options: ["Um tipo de moeda antiga", "Um cartão de plástico", "Pagamento digital instantâneo", "Um cofrinho"],
    correct: 2,
  },
];

export const ranking = [
  { name: "Lara", points: 245, avatar: "🦸‍♀️" },
  { name: "Theo", points: 180, avatar: "🧑‍🚀" },
  { name: "Mia", points: 95, avatar: "🧚" },
];
