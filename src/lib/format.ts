export function formatWon(n: number, decimals = 0): string {
  const fixed = n.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const withComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart ? `${withComma}.${decPart}` : withComma;
}

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

interface FunItem {
  emoji: string;
  name: string;
  price: number;
}

const ITEMS: FunItem[] = [
  { emoji: '🍙', name: '편의점 삼각김밥', price: 1300 },
  { emoji: '☕', name: '아메리카노', price: 4500 },
  { emoji: '🍜', name: '컵라면', price: 1500 },
  { emoji: '🍗', name: '치킨', price: 22000 },
  { emoji: '🍔', name: '햄버거 세트', price: 8000 },
  { emoji: '🧋', name: '버블티', price: 5500 },
  { emoji: '🍕', name: '피자 한 판', price: 25000 },
  { emoji: '🚕', name: '택시 기본요금', price: 4800 },
  { emoji: '🎮', name: '인디 게임', price: 15000 },
  { emoji: '🍣', name: '초밥 1인분', price: 18000 },
];

/** 현재 번 돈으로 살 수 있는 가장 위트있는 환산 1~2개 반환 */
export function funConversions(amount: number): { emoji: string; text: string }[] {
  const results: { emoji: string; text: string }[] = [];
  for (const item of ITEMS) {
    const count = amount / item.price;
    if (count >= 0.5) {
      results.push({
        emoji: item.emoji,
        text: `${item.name} ${count >= 100 ? Math.floor(count) : count.toFixed(1)}개`,
      });
    }
    if (results.length >= 3) break;
  }
  // 너무 적게 벌었을 때
  if (results.length === 0) {
    const coffee = amount / 4500;
    results.push({ emoji: '☕', text: `아메리카노 ${coffee.toFixed(2)}잔` });
  }
  return results.slice(0, 3);
}
