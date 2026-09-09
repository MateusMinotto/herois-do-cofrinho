interface Props {
  points: number;
  pointValue: number;
  goal?: number;
}

export function PiggyBank({ points, pointValue, goal = 500 }: Props) {
  const pct = Math.min(100, Math.round((points / goal) * 100));
  const reais = (points * pointValue).toFixed(2).replace(".", ",");

  return (
    <div className="relative rounded-3xl bg-gradient-fun p-6 text-fun-foreground shadow-pop overflow-hidden">
      <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-90">Meu Cofrinho</p>
          <p className="font-display text-5xl font-black drop-shadow">{points}</p>
          <p className="text-sm font-semibold opacity-90">pontos = R$ {reais}</p>
        </div>
        <div className="relative">
          <div className="text-7xl animate-float drop-shadow-lg">🐷</div>
          <div className="absolute -top-1 -right-2 h-8 w-8 rounded-full bg-coin grid place-items-center text-coin-foreground font-bold shadow-coin animate-coin-spin">
            $
          </div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-xs font-bold mb-1">
          <span>Cheio em</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full rounded-full bg-coin shadow-coin transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
