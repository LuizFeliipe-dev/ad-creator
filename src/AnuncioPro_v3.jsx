import { useState, useEffect, useRef, useCallback } from "react";

// ─── MARKETPLACE DATA ───────────────────────────────────────────────────────
const MARKETPLACES = {
  shopee: {
    id: "shopee",
    name: "Shopee",
    emoji: "🟠",
    color: "#EE4D2D",
    categories: {
      "Casa & Decoração": { cpf: 0.14, cnpj: 0.16 },
      "Eletrônicos": { cpf: 0.12, cnpj: 0.14 },
      "Moda & Acessórios": { cpf: 0.13, cnpj: 0.15 },
      "Beleza & Cuidados": { cpf: 0.14, cnpj: 0.16 },
      "Brinquedos & Hobbies": { cpf: 0.13, cnpj: 0.15 },
      "Esporte & Lazer": { cpf: 0.12, cnpj: 0.14 },
      "Alimentos & Bebidas": { cpf: 0.10, cnpj: 0.12 },
      "Outros": { cpf: 0.14, cnpj: 0.16 },
    },
    fixedFee: 2.00,
    freightProgram: { participates: true, cost: 0.10, label: "Shopee Envios" },
    paymentFee: 0.019,
    notes: "Comissão varia por categoria. CNPJ tem alíquota maior.",
  },
  mercadolivre: {
    id: "mercadolivre",
    name: "Mercado Livre",
    emoji: "🟡",
    color: "#FFE600",
    categories: {
      "Casa & Decoração": { cpf: 0.11, cnpj: 0.13 },
      "Eletrônicos": { cpf: 0.10, cnpj: 0.12 },
      "Moda & Acessórios": { cpf: 0.12, cnpj: 0.14 },
      "Beleza & Cuidados": { cpf: 0.11, cnpj: 0.13 },
      "Brinquedos & Hobbies": { cpf: 0.11, cnpj: 0.13 },
      "Esporte & Lazer": { cpf: 0.10, cnpj: 0.12 },
      "Alimentos & Bebidas": { cpf: 0.09, cnpj: 0.11 },
      "Outros": { cpf: 0.11, cnpj: 0.13 },
    },
    fixedFee: 0,
    freightProgram: { participates: true, cost: 0.08, label: "ML Envios Full" },
    paymentFee: 0.029,
    notes: "Anúncio Clássico (11%) ou Premium (16%). Aqui usamos Clássico.",
  },
  amazon: {
    id: "amazon",
    name: "Amazon",
    emoji: "🔶",
    color: "#FF9900",
    categories: {
      "Casa & Decoração": { cpf: 0.15, cnpj: 0.15 },
      "Eletrônicos": { cpf: 0.08, cnpj: 0.08 },
      "Moda & Acessórios": { cpf: 0.17, cnpj: 0.17 },
      "Beleza & Cuidados": { cpf: 0.15, cnpj: 0.15 },
      "Brinquedos & Hobbies": { cpf: 0.12, cnpj: 0.12 },
      "Esporte & Lazer": { cpf: 0.15, cnpj: 0.15 },
      "Alimentos & Bebidas": { cpf: 0.08, cnpj: 0.08 },
      "Outros": { cpf: 0.15, cnpj: 0.15 },
    },
    fixedFee: 2.00,
    freightProgram: { participates: true, cost: 0.12, label: "FBA Amazon" },
    paymentFee: 0.025,
    notes: "Taxa de referência por categoria. Não diferencia CPF/CNPJ.",
  },
  magalu: {
    id: "magalu",
    name: "Magalu",
    emoji: "🔵",
    color: "#0086FF",
    categories: {
      "Casa & Decoração": { cpf: 0.12, cnpj: 0.12 },
      "Eletrônicos": { cpf: 0.10, cnpj: 0.10 },
      "Moda & Acessórios": { cpf: 0.14, cnpj: 0.14 },
      "Beleza & Cuidados": { cpf: 0.12, cnpj: 0.12 },
      "Brinquedos & Hobbies": { cpf: 0.12, cnpj: 0.12 },
      "Esporte & Lazer": { cpf: 0.12, cnpj: 0.12 },
      "Alimentos & Bebidas": { cpf: 0.10, cnpj: 0.10 },
      "Outros": { cpf: 0.12, cnpj: 0.12 },
    },
    fixedFee: 0,
    freightProgram: { participates: true, cost: 0.09, label: "Magalu Entregas" },
    paymentFee: 0.02,
    notes: "Marketplace consolidado. Boas taxas para eletrônicos.",
  },
};

const CATEGORIES = Object.keys(MARKETPLACES.shopee.categories);

// ─── PRICING CALCULATOR ─────────────────────────────────────────────────────
function calculatePrice({ cost, margin, marketplace, category, sellerType, useFreight }) {
  if (!cost || !margin || !marketplace || !category) return null;
  const mp = MARKETPLACES[marketplace];
  const commissionRate = mp.categories[category]?.[sellerType === "CNPJ" ? "cnpj" : "cpf"] || 0.14;
  const fixedFee = mp.fixedFee;
  const paymentFee = mp.paymentFee;
  const freightCostRate = useFreight ? mp.freightProgram.cost : 0;
  const taxRate = sellerType === "CNPJ" ? 0.08 : 0;
  const totalDeductionRate = commissionRate + paymentFee + freightCostRate + taxRate;
  const targetMarginRate = margin / 100;
  const recommendedPrice = cost / (1 - totalDeductionRate - targetMarginRate);
  const minPrice = cost / (1 - totalDeductionRate);

  const calcBreakdown = (price) => {
    const commission = price * commissionRate;
    const payment = price * paymentFee;
    const freight = price * freightCostRate;
    const tax = price * taxRate;
    const totalDeductions = commission + payment + freight + tax + fixedFee + cost;
    const profit = price - totalDeductions;
    const realMargin = (profit / price) * 100;
    return { price, commission, payment, freight, tax, fixedFee, profit, realMargin, cost };
  };

  const recommended = calcBreakdown(Math.ceil(recommendedPrice * 100) / 100);
  const minimum = calcBreakdown(Math.ceil(minPrice * 100) / 100);

  const scenarios = [0.85, 0.9, 0.95, 1.0, 1.05, 1.10, 1.15, 1.20].map(factor => {
    const p = Math.round(recommended.price * factor * 100) / 100;
    return calcBreakdown(p);
  });

  return { recommended, minimum, scenarios, commissionRate, paymentFee, freightCostRate, taxRate };
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0a0a0f;
    --paper: #f5f2eb;
    --cream: #faf8f3;
    --orange: #ff5c1a;
    --orange-pale: #fff3ee;
    --gold: #e8b84b;
    --green: #1a9e5c;
    --green-pale: #edfaf3;
    --red: #e05252;
    --red-pale: #fef0f0;
    --muted: #6b6860;
    --border: #ddd9d0;
    --sidebar-w: 220px;
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
    --shadow-md: 0 8px 32px rgba(0,0,0,0.10);
    --radius: 12px;
    --radius-sm: 8px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--paper);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .app-shell {
    display: flex;
    min-height: 100vh;
  }

  /* ── SIDEBAR ── */
  .sidebar {
    background: var(--ink);
    display: flex;
    flex-direction: column;
    padding: 22px 14px 24px;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    width: var(--sidebar-w);
    z-index: 20;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .sidebar-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.15rem;
    letter-spacing: -0.03em;
    color: #fff;
    padding: 0 6px;
    margin-bottom: 28px;
    white-space: nowrap;
  }
  .sidebar-logo span { color: var(--orange); }
  .sidebar-section-label {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    font-weight: 700;
    padding: 0 6px;
    margin: 16px 0 5px;
    white-space: nowrap;
  }
  .sidebar-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
    color: rgba(255,255,255,0.5);
    margin-bottom: 1px;
    min-height: 40px;
  }
  .sidebar-item:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.85); }
  .sidebar-item.active { background: var(--orange); color: #fff; }
  .sidebar-item .s-icon {
    font-size: 0.85rem;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 2px;
  }
  .sidebar-item .s-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .sidebar-item .s-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-item .s-desc { font-size: 0.65rem; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-spacer { flex: 1; }

  /* ── MAIN ── */
  .main-content {
    margin-left: var(--sidebar-w);
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  /* ── TOPBAR ── */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 32px;
    background: var(--cream);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 5;
    min-height: 56px;
  }
  .topbar-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .topbar-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 16px;
    border-radius: var(--radius-sm);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    white-space: nowrap;
  }
  .btn-primary { background: var(--orange); color: #fff; }
  .btn-primary:hover:not(:disabled) { background: #ff7040; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid var(--border); }
  .btn-ghost:hover { border-color: var(--ink); color: var(--ink); }
  .btn-sm { padding: 5px 11px; font-size: 0.76rem; }

  /* ── CONTENT AREA ── */
  .content-area { padding: 28px 32px; flex: 1; }

  /* ── STEP PROGRESS ── */
  .step-progress {
    display: flex;
    align-items: center;
    margin-bottom: 28px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px 20px;
    overflow: hidden;
  }
  .step-node {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }
  .step-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.72rem;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    flex-shrink: 0;
    transition: all 0.3s;
  }
  .step-circle.done { background: var(--green); color: #fff; }
  .step-circle.active { background: var(--orange); color: #fff; box-shadow: 0 0 0 3px rgba(255,92,26,0.18); }
  .step-circle.todo { background: var(--border); color: var(--muted); }
  .step-info { min-width: 0; }
  .step-info .step-name { font-size: 0.78rem; font-weight: 600; white-space: nowrap; }
  .step-info .step-name.active { color: var(--orange); }
  .step-info .step-name.done { color: var(--green); }
  .step-info .step-name.todo { color: var(--muted); }
  .step-info .step-desc { font-size: 0.65rem; color: var(--muted); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
  .step-connector { flex: 1; height: 1px; background: var(--border); margin: 0 8px; min-width: 12px; }

  /* ── GRID HELPERS ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

  /* ── CARD ── */
  .card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px;
    box-shadow: var(--shadow-sm);
  }
  .card-header { margin-bottom: 18px; }
  .card-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; letter-spacing: -0.02em; }
  .card-subtitle { font-size: 0.76rem; color: var(--muted); margin-top: 3px; line-height: 1.4; }

  /* ── MARKETPLACE GRID ── */
  .mp-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .mp-tile {
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 16px 8px 14px;
    text-align: center;
    cursor: pointer;
    transition: all 0.18s;
    position: relative;
    background: var(--cream);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .mp-tile:hover { border-color: var(--orange); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
  .mp-tile.selected { border-color: var(--orange); background: var(--orange-pale); }
  .mp-logo-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    flex-shrink: 0;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin-bottom: 2px;
  }
  .mp-tile .mp-name { font-size: 0.78rem; font-weight: 700; font-family: 'Syne', sans-serif; line-height: 1.2; }
  .mp-tile .mp-rate { font-size: 0.65rem; color: var(--muted); line-height: 1.3; }
  .mp-tile .selected-badge {
    position: absolute; top: -7px; right: -7px;
    background: var(--orange); color: #fff; border-radius: 50%;
    width: 18px; height: 18px; font-size: 0.6rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff;
  }

  /* ── FORM ── */
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 0.74rem; font-weight: 600; color: var(--ink); }
  .form-hint { font-size: 0.68rem; color: var(--muted); }
  .form-input, .form-select {
    background: var(--cream);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 9px 12px;
    font-size: 0.85rem;
    font-family: 'DM Sans', sans-serif;
    color: var(--ink);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    width: 100%;
  }
  .form-input:focus, .form-select:focus {
    border-color: var(--orange);
    box-shadow: 0 0 0 3px rgba(255,92,26,0.1);
    background: #fff;
  }
  .form-select {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236b6860' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  /* ── TOGGLE ── */
  .toggle-group { display: flex; gap: 6px; }
  .toggle-btn {
    flex: 1;
    padding: 8px 10px;
    border-radius: var(--radius-sm);
    border: 1.5px solid var(--border);
    background: var(--cream);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
    color: var(--muted);
    white-space: nowrap;
  }
  .toggle-btn.active { background: var(--orange); border-color: var(--orange); color: #fff; }

  /* ── METRIC CARDS ── */
  .metric-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .metric-card { background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 16px; }
  .metric-card.dark { background: var(--ink); border-color: var(--ink); }
  .metric-card.green { background: var(--green-pale); border-color: #a8e8c6; }
  .metric-card.orange { background: var(--orange-pale); border-color: #ffc4a8; }
  .m-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 6px; }
  .metric-card.dark .m-label { color: rgba(255,255,255,0.4); }
  .metric-card.green .m-label { color: rgba(26,158,92,0.7); }
  .metric-card.orange .m-label { color: rgba(255,92,26,0.7); }
  .m-value { font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1.1; }
  .metric-card.dark .m-value { color: #fff; }
  .metric-card.green .m-value { color: var(--green); }
  .metric-card.orange .m-value { color: var(--orange); }
  .m-sub { font-size: 0.7rem; color: var(--muted); margin-top: 4px; }
  .metric-card.dark .m-sub { color: rgba(255,255,255,0.35); }

  /* ── BREAKDOWN ── */
  .breakdown { background: var(--cream); border-radius: var(--radius-sm); overflow: hidden; margin-top: 14px; border: 1px solid var(--border); }
  .breakdown-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 14px; border-bottom: 1px solid var(--border); font-size: 0.815rem; gap: 8px; }
  .breakdown-row:last-child { border-bottom: none; }
  .breakdown-row .b-label { color: var(--muted); min-width: 0; flex: 1; }
  .breakdown-row .b-val { font-weight: 600; flex-shrink: 0; }
  .breakdown-row .b-val.neg { color: var(--red); }
  .breakdown-row .b-val.pos { color: var(--green); }
  .breakdown-row.total { background: #fff; }
  .breakdown-row.total .b-label { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.82rem; color: var(--ink); }
  .breakdown-row.total .b-val.pos { font-family: 'Syne', sans-serif; font-size: 1rem; }

  /* ── SCENARIO TABLE ── */
  .scenario-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  .scenario-table th { text-align: left; padding: 7px 10px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 700; }
  .scenario-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); }
  .scenario-table tr:last-child td { border-bottom: none; }
  .scenario-table tr:hover td { background: var(--cream); }
  .scenario-table .recommended-row td { background: var(--orange-pale); }
  .scenario-table .recommended-row td:first-child { border-left: 3px solid var(--orange); padding-left: 8px; }
  .profit-pill { display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 0.7rem; font-weight: 700; }
  .profit-pill.pos { background: var(--green-pale); color: var(--green); }
  .profit-pill.neg { background: var(--red-pale); color: var(--red); }
  .profit-pill.neutral { background: #f0f0ee; color: var(--muted); }

  /* ── AI SECTION ── */
  .ai-output { display: flex; flex-direction: column; gap: 14px; }
  .ai-block { background: var(--cream); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .ai-block-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); background: #fff; }
  .ai-block-title { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 7px; }
  .ai-block-body { padding: 14px 16px; font-size: 0.85rem; line-height: 1.7; color: var(--ink); }
  .ai-block-body.keywords { display: flex; flex-wrap: wrap; gap: 7px; }
  .kw-tag { background: #fff; border: 1px solid var(--border); border-radius: 100px; padding: 3px 11px; font-size: 0.72rem; font-weight: 500; }
  .kw-tag.primary { background: var(--orange-pale); border-color: #ffc4a8; color: var(--orange); font-weight: 700; }

  /* ── TYPING ── */
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .cursor { display: inline-block; width: 2px; height: 1em; background: var(--orange); margin-left: 2px; animation: blink 1s infinite; vertical-align: text-bottom; }

  /* ── LOADING ── */
  .loading-bar { height: 3px; background: var(--border); border-radius: 100px; overflow: hidden; margin-bottom: 18px; }
  .loading-bar-fill { height: 100%; background: linear-gradient(90deg, var(--orange), var(--gold)); border-radius: 100px; transition: width 0.4s ease; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinner { width: 18px; height: 18px; border: 2px solid var(--border); border-top-color: var(--orange); border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }

  /* ── RESULT SUMMARY ── */
  .result-summary {
    background: var(--ink); border-radius: var(--radius);
    padding: 22px 24px; color: #fff;
    display: grid; grid-template-columns: repeat(3, 1fr) auto;
    align-items: center; gap: 16px;
    margin-bottom: 20px; position: relative; overflow: hidden;
  }
  .result-summary::before {
    content: '';
    position: absolute; top: -60px; right: -60px;
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,92,26,0.22) 0%, transparent 70%);
    pointer-events: none;
  }
  .rs-label { font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.4); margin-bottom: 4px; font-weight: 700; }
  .rs-value { font-family: 'Syne', sans-serif; font-size: 1.9rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
  .rs-sub { font-size: 0.72rem; color: rgba(255,255,255,0.4); margin-top: 3px; }
  .rs-badge { background: var(--green); color: #fff; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.75rem; padding: 5px 12px; border-radius: 100px; white-space: nowrap; }

  /* ── UPLOAD ── */
  .upload-area { border: 2px dashed var(--border); border-radius: var(--radius); padding: 28px 20px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--cream); }
  .upload-area:hover { border-color: var(--orange); background: var(--orange-pale); }
  .upload-area .upload-icon { font-size: 2rem; margin-bottom: 8px; }
  .upload-area .upload-text { font-size: 0.83rem; color: var(--muted); }
  .upload-area .upload-text strong { color: var(--orange); }
  .image-previews { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .img-preview { position: relative; width: 68px; height: 68px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); flex-shrink: 0; }
  .img-preview img { width: 100%; height: 100%; object-fit: cover; }
  .img-preview .remove-img { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.65); color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; cursor: pointer; }

  /* ── RANGE ── */
  input[type=range] { width: 100%; accent-color: var(--orange); cursor: pointer; }
  .range-labels { display: flex; justify-content: space-between; font-size: 0.68rem; color: var(--muted); margin-top: 3px; }

  /* ── ALERTS ── */
  .alert { padding: 11px 14px; border-radius: var(--radius-sm); font-size: 0.8rem; display: flex; align-items: flex-start; gap: 9px; line-height: 1.5; }
  .alert.warn { background: #fff8e6; border-left: 3px solid var(--gold); color: #7a5c1a; }
  .alert.info { background: #e8f4fd; border-left: 3px solid #5b8dee; color: #1a3a7a; }
  .alert.success { background: var(--green-pale); border-left: 3px solid var(--green); color: #0e5c35; }

  /* ── COPY BTN ── */
  .copy-btn { background: var(--cream); border: 1px solid var(--border); border-radius: 5px; padding: 3px 9px; font-size: 0.7rem; cursor: pointer; color: var(--muted); transition: all 0.15s; white-space: nowrap; }
  .copy-btn:hover { background: #fff; color: var(--ink); }
  .copy-btn.copied { background: var(--green-pale); border-color: var(--green); color: var(--green); }

  /* ── FINAL PUBLISH ── */
  .final-publish { background: var(--green); border-radius: var(--radius); padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .final-publish .fp-text h3 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1rem; color: #fff; }
  .final-publish .fp-text p { font-size: 0.78rem; color: rgba(255,255,255,0.7); margin-top: 3px; }
  .btn-publish { background: #fff; color: var(--green); font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.85rem; padding: 10px 24px; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: transform 0.15s; white-space: nowrap; }
  .btn-publish:hover { transform: translateY(-2px); }

  /* ── RESPONSIVE ── */
  @media (max-width: 860px) {
    .sidebar { display: none; }
    .main-content { margin-left: 0; }
    .content-area { padding: 20px 16px; }
    .topbar { padding: 12px 16px; }
    .mp-grid { grid-template-columns: repeat(2, 1fr); }
    .grid-2, .metric-cards, .grid-3, .result-summary { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 560px) {
    .mp-grid { grid-template-columns: repeat(2, 1fr); }
    .grid-2, .metric-cards, .grid-3, .result-summary { grid-template-columns: 1fr; }
    .step-info .step-desc { display: none; }
  }

  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .fade-in { animation: fadeIn 0.3s ease both; }
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n) => n < 0 ? `− R$ ${Math.abs(n).toFixed(2)}` : `R$ ${n.toFixed(2)}`;
const fmtPos = (n) => `R$ ${n.toFixed(2)}`;
const fmtPct = (n) => `${n.toFixed(1)}%`;

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy}>{copied ? "✓ Copiado" : "Copiar"}</button>;
}

function TypingText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span>{displayed}{!done && <span className="cursor" />}</span>;
}

// ─── STEPS ───────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, name: "Marketplace", desc: "Onde você vai vender" },
  { id: 2, name: "Produto", desc: "Dados e categoria" },
  { id: 3, name: "Precificação", desc: "Cálculo e margens" },
  { id: 4, name: "Anúncio IA", desc: "Geração automática" },
];

// ─── MARKETPLACE LOGOS ───────────────────────────────────────────────────────
const MP_LOGOS = {
  shopee: { bg: "#EE4D2D", text: "#fff", label: "S" },
  mercadolivre: { bg: "#FFE600", text: "#333", label: "ML" },
  amazon: { bg: "#FF9900", text: "#fff", label: "A" },
  magalu: { bg: "#0086FF", text: "#fff", label: "M" },
};

function MpLogo({ id }) {
  const l = MP_LOGOS[id];
  return (
    <div className="mp-logo-circle" style={{ background: l.bg }}>
      <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: l.label.length > 1 ? "0.75rem" : "1.1rem", color: l.text, letterSpacing: "-0.03em" }}>
        {l.label}
      </span>
    </div>
  );
}

// ─── STEP 1: MARKETPLACE ─────────────────────────────────────────────────────
function StepMarketplace({ data, onChange, onNext }) {
  const selected = data.marketplace;
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Selecione o marketplace</div>
          <div className="card-subtitle">Cada plataforma tem suas próprias taxas e regras de comissão.</div>
        </div>
        <div className="mp-grid">
          {Object.values(MARKETPLACES).map(mp => {
            const rate = mp.categories["Outros"]["cpf"];
            return (
              <div
                key={mp.id}
                className={`mp-tile ${selected === mp.id ? "selected" : ""}`}
                onClick={() => onChange({ marketplace: mp.id })}
              >
                <MpLogo id={mp.id} />
                <div className="mp-name">{mp.name}</div>
                <div className="mp-rate">a partir de {fmtPct(rate * 100)}</div>
                {selected === mp.id && <div className="selected-badge">✓</div>}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="card fade-in">
          <div className="card-header">
            <div className="card-title">{MARKETPLACES[selected].name} — Visão geral</div>
          </div>
          <div className="alert info" style={{ marginBottom: 14 }}>
            <span>ℹ️</span> <span>{MARKETPLACES[selected].notes}</span>
          </div>
          <div className="grid-3">
            <div className="metric-card">
              <div className="m-label">Taxa de pagamento</div>
              <div className="m-value" style={{ fontSize: "1.15rem" }}>{fmtPct(MARKETPLACES[selected].paymentFee * 100)}</div>
            </div>
            <div className="metric-card">
              <div className="m-label">Taxa fixa por venda</div>
              <div className="m-value" style={{ fontSize: "1.15rem" }}>{MARKETPLACES[selected].fixedFee > 0 ? fmtPos(MARKETPLACES[selected].fixedFee) : "—"}</div>
            </div>
            <div className="metric-card">
              <div className="m-label">Programa logístico</div>
              <div className="m-value" style={{ fontSize: "0.82rem", marginTop: 6, lineHeight: 1.3 }}>{MARKETPLACES[selected].freightProgram.label}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn btn-primary" disabled={!selected} onClick={onNext}>
          Continuar →
        </button>
      </div>
    </div>
  );
}

// ─── STEP 2: PRODUCT ─────────────────────────────────────────────────────────
function StepProduct({ data, onChange, onNext, onBack }) {
  const handleImage = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map(f => URL.createObjectURL(f));
    onChange({ images: [...(data.images || []), ...urls].slice(0, 6) });
  };
  const removeImg = (i) => {
    const imgs = [...data.images];
    imgs.splice(i, 1);
    onChange({ images: imgs });
  };
  const valid = data.title?.trim() && data.category && data.cost > 0;

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Imagens do produto</div>
          <div className="card-subtitle">Adicione até 6 imagens (simulação visual — a IA usará a descrição)</div>
        </div>
        <label className="upload-area" style={{ display: "block" }}>
          <input type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleImage} />
          <div className="upload-icon">📸</div>
          <div className="upload-text"><strong>Clique para enviar</strong> ou arraste as imagens aqui</div>
          <div className="upload-text" style={{ fontSize: "0.72rem", marginTop: 4 }}>PNG, JPG até 10MB</div>
        </label>
        {data.images?.length > 0 && (
          <div className="image-previews">
            {data.images.map((url, i) => (
              <div key={i} className="img-preview">
                <img src={url} alt="" />
                <div className="remove-img" onClick={() => removeImg(i)}>✕</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Informações do produto</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Título do produto *</label>
            <input
              className="form-input"
              placeholder="Ex: Luminária LED de Mesa Recarregável..."
              value={data.title || ""}
              onChange={e => onChange({ title: e.target.value })}
            />
            <span className="form-hint">{(data.title || "").length}/200 caracteres</span>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Categoria *</label>
              <select className="form-select" value={data.category || ""} onChange={e => onChange({ category: e.target.value })}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Marca / Fabricante</label>
              <input className="form-input" placeholder="Ex: Generic, Samsung, Nike..." value={data.brand || ""} onChange={e => onChange({ brand: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição breve (para a IA gerar o anúncio)</label>
            <textarea
              className="form-input"
              style={{ minHeight: 90, resize: "vertical" }}
              placeholder="Descreva as principais características, material, tamanho, cor, uso..."
              value={data.description || ""}
              onChange={e => onChange({ description: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Dados financeiros e logísticos</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Custo de aquisição (R$) *</label>
              <input
                className="form-input"
                type="number" min="0" step="0.01"
                placeholder="0.00"
                value={data.cost || ""}
                onChange={e => onChange({ cost: parseFloat(e.target.value) || 0 })}
              />
              <span className="form-hint">Quanto você pagou no produto</span>
            </div>
            <div className="form-group">
              <label className="form-label">Margem de lucro desejada: {data.margin || 25}%</label>
              <input
                type="range" min="5" max="80" step="1"
                value={data.margin || 25}
                onChange={e => onChange({ margin: parseInt(e.target.value) })}
              />
              <div className="range-labels"><span>5%</span><span>25%</span><span>50%</span><span>80%</span></div>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Tipo de vendedor</label>
              <div className="toggle-group">
                {["CPF", "CNPJ"].map(t => (
                  <div key={t} className={`toggle-btn ${(data.sellerType || "CPF") === t ? "active" : ""}`} onClick={() => onChange({ sellerType: t })}>{t}</div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Participar de programa de frete?</label>
              <div className="toggle-group">
                <div className={`toggle-btn ${data.useFreight ? "active" : ""}`} onClick={() => onChange({ useFreight: true })}>Sim, frete grátis</div>
                <div className={`toggle-btn ${!data.useFreight ? "active" : ""}`} onClick={() => onChange({ useFreight: false })}>Não participar</div>
              </div>
              <span className="form-hint">{data.useFreight ? `Custo absorvido: ${fmtPct(MARKETPLACES[data.marketplace || "shopee"].freightProgram.cost * 100)} do preço` : "Frete cobrado separado"}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="btn btn-ghost" onClick={onBack}>← Voltar</button>
        <button className="btn btn-primary" disabled={!valid} onClick={onNext}>
          Calcular preço →
        </button>
      </div>
    </div>
  );
}

// ─── DIRECT BREAKDOWN (não usa calculatePrice para evitar bugs) ──────────────
function calcBreakdownDirect({ price, cost, commissionRate, paymentFee, freightCostRate, taxRate, fixedFee }) {
  const commission = price * commissionRate;
  const payment    = price * paymentFee;
  const freight    = price * freightCostRate;
  const tax        = price * taxRate;
  const profit     = price - commission - payment - freight - tax - fixedFee - cost;
  const realMargin = (profit / price) * 100;
  return { price, commission, payment, freight, tax, fixedFee, cost, profit, realMargin };
}

// ─── STEP 3: PRICING ─────────────────────────────────────────────────────────
function StepPricing({ data, onChange, onNext, onBack }) {
  const result = calculatePrice({
    cost: data.cost,
    margin: data.margin || 25,
    marketplace: data.marketplace,
    category: data.category,
    sellerType: data.sellerType || "CPF",
    useFreight: data.useFreight,
  });
  const mp = MARKETPLACES[data.marketplace];

  if (!result) return <div className="alert info">Preencha os dados do produto para ver o cálculo.</div>;

  const rec = result.recommended;
  const min = result.minimum;

  // Preço que o usuário está simulando no slider — default = recomendado
  const chosenPrice = data.chosenPrice != null ? data.chosenPrice : rec.price;

  // Breakdown DIRETO para o preço escolhido no slider (sem recalcular via calculatePrice)
  const sliderBreakdown = calcBreakdownDirect({
    price: chosenPrice,
    cost: data.cost,
    commissionRate: result.commissionRate,
    paymentFee:     result.paymentFee,
    freightCostRate: result.freightCostRate,
    taxRate:         result.taxRate,
    fixedFee:        mp.fixedFee,
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Banner mostra os valores do PREÇO RECOMENDADO, explicitamente */}
      <div className="result-summary">
        <div>
          <div className="rs-label">Preço recomendado</div>
          <div className="rs-value">{fmtPos(rec.price)}</div>
          <div className="rs-sub">Para margem de {fmtPct(rec.realMargin)}</div>
        </div>
        <div>
          <div className="rs-label">Preço mínimo (sem prejuízo)</div>
          <div className="rs-value" style={{ fontSize: "1.4rem" }}>{fmtPos(min.price)}</div>
          <div className="rs-sub">Cobre custos + taxas, lucro = R$ 0</div>
        </div>
        <div>
          <div className="rs-label">Lucro no preço recomendado</div>
          <div className="rs-value" style={{ color: "var(--gold)" }}>{fmtPos(rec.profit)}</div>
          <div className="rs-sub">{mp.name} · {data.sellerType || "CPF"} · publicando a {fmtPos(rec.price)}</div>
        </div>
        <div className="rs-badge">✓ Rentável</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Simulador de preço</div>
            <div className="card-subtitle">
              Arraste para ver o lucro real a cada preço de publicação
            </div>
          </div>

          {/* Destaque do preço atual e lucro simulado */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12, padding: "10px 14px", background: "var(--cream)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Publicando a</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em" }}>{fmtPos(chosenPrice)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Lucro líquido</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em", color: sliderBreakdown.profit >= 0 ? "var(--green)" : "var(--red)" }}>
                {fmt(sliderBreakdown.profit)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>Margem real</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em", color: "var(--muted)" }}>
                {fmtPct(sliderBreakdown.realMargin)}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <input
              type="range"
              min={Math.max(1, min.price * 0.7)}
              max={rec.price * 1.6}
              step={0.5}
              value={chosenPrice}
              onChange={e => onChange({ chosenPrice: parseFloat(e.target.value) })}
            />
            <div className="range-labels">
              <span>⚠ Prejuízo</span>
              <span style={{ color: "var(--red)", fontWeight: 600 }}>Mín: {fmtPos(min.price)}</span>
              <span style={{ color: "var(--orange)", fontWeight: 600 }}>Rec: {fmtPos(rec.price)}</span>
              <span>{fmtPos(rec.price * 1.6)}</span>
            </div>
          </div>

          {/* Breakdown detalhado sempre mostra o preço do slider */}
          <div className="breakdown">
            <div className="breakdown-row">
              <span className="b-label">💰 Receita (preço de venda)</span>
              <span className="b-val">{fmtPos(sliderBreakdown.price)}</span>
            </div>
            <div className="breakdown-row">
              <span className="b-label">Comissão {mp.name} ({fmtPct(result.commissionRate * 100)})</span>
              <span className="b-val neg">− {fmtPos(sliderBreakdown.commission)}</span>
            </div>
            <div className="breakdown-row">
              <span className="b-label">Taxa de pagamento ({fmtPct(result.paymentFee * 100)})</span>
              <span className="b-val neg">− {fmtPos(sliderBreakdown.payment)}</span>
            </div>
            {result.freightCostRate > 0 && (
              <div className="breakdown-row">
                <span className="b-label">Custo logístico ({fmtPct(result.freightCostRate * 100)})</span>
                <span className="b-val neg">− {fmtPos(sliderBreakdown.freight)}</span>
              </div>
            )}
            {result.taxRate > 0 && (
              <div className="breakdown-row">
                <span className="b-label">Impostos CNPJ ({fmtPct(result.taxRate * 100)})</span>
                <span className="b-val neg">− {fmtPos(sliderBreakdown.tax)}</span>
              </div>
            )}
            {mp.fixedFee > 0 && (
              <div className="breakdown-row">
                <span className="b-label">Taxa fixa por venda</span>
                <span className="b-val neg">− {fmtPos(mp.fixedFee)}</span>
              </div>
            )}
            <div className="breakdown-row">
              <span className="b-label">Custo de aquisição do produto</span>
              <span className="b-val neg">− {fmtPos(data.cost)}</span>
            </div>
            <div className="breakdown-row total">
              <span className="b-label">= Lucro líquido real</span>
              <span className={`b-val ${sliderBreakdown.profit >= 0 ? "pos" : "neg"}`}>
                {fmt(sliderBreakdown.profit)}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Simulação de cenários</div>
            <div className="card-subtitle">Compare diferentes faixas de preço</div>
          </div>
          <table className="scenario-table">
            <thead><tr><th>Preço</th><th>Lucro</th><th>Margem</th><th>Status</th></tr></thead>
            <tbody>
              {result.scenarios.map((s, i) => {
                const isRec = Math.abs(s.price - rec.price) < 0.5;
                return (
                  <tr key={i} className={isRec ? "recommended-row" : ""}>
                    <td style={{ fontWeight: 600 }}>{fmtPos(s.price)}{isRec ? " ⭐" : ""}</td>
                    <td style={{ color: s.profit < 0 ? "var(--red)" : "var(--green)", fontWeight: 600 }}>{fmt(s.profit)}</td>
                    <td>{fmtPct(s.realMargin)}</td>
                    <td>
                      <span className={`profit-pill ${s.profit < 0 ? "neg" : s.realMargin >= 20 ? "pos" : "neutral"}`}>
                        {s.profit < 0 ? "Prejuízo" : s.realMargin >= 20 ? "Ótimo" : "Ok"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data.sellerType === "CNPJ" && (
        <div className="alert warn">
          <span>⚠️</span>
          <span><strong>CNPJ detectado:</strong> Impostos de 8% e comissões diferenciadas foram aplicados automaticamente. Consulte um contador para validar o regime tributário correto.</span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-ghost" onClick={onBack}>← Voltar</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "right" }}>
            Publicando a <strong style={{ color: "var(--ink)" }}>{fmtPos(chosenPrice)}</strong> · lucro de <strong style={{ color: sliderBreakdown.profit >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(sliderBreakdown.profit)}</strong>
          </div>
          <button className="btn btn-primary" onClick={() => { onChange({ finalPrice: chosenPrice, finalProfit: sliderBreakdown.profit }); onNext(); }}>
            Gerar anúncio com IA →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 4: AI AD GENERATION ────────────────────────────────────────────────
function StepAd({ data, onBack, onRestart }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ad, setAd] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState({});
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generateAd();
  }, []);

  const generateAd = async () => {
    setLoading(true);
    setProgress(0);
    setAd(null);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 8 : p);
    }, 300);

    const mp = MARKETPLACES[data.marketplace];
    const prompt = `Você é um redator especialista em vendas online no Brasil, com anos de experiência criando anúncios de alta conversão para ${mp.name}. Você escreve como um vendedor experiente que conhece o cliente — não como uma IA gerando texto genérico.

Seu estilo é: direto, natural, humano, com personalidade. Usa a língua portuguesa do Brasil do jeito que as pessoas falam no dia a dia. Não exagera nos adjetivos. Não usa frases clichê como "produto de alta qualidade" ou "não perca essa oportunidade". Em vez disso, você mostra o valor real do produto de forma concreta.

PRODUTO PARA ANUNCIAR:
- Nome: ${data.title}
- Categoria: ${data.category}
- Marketplace: ${mp.name}
- Marca: ${data.brand || "sem marca específica"}
- Informações do vendedor: ${data.description || "produto para uso cotidiano"}
- Preço: R$ ${(data.finalPrice || 0).toFixed(2)}

REGRAS DE COPYWRITING QUE VOCÊ DEVE SEGUIR:

TÍTULO:
- Máximo 100 caracteres
- Comece com a palavra mais buscada (substantivo principal do produto)
- Inclua: o que é + principal benefício ou característica diferenciadora + variação mais procurada (cor, tamanho, material) se aplicável
- Sem emojis, sem caps lock, sem pontuação desnecessária
- Exemplo de bom título: "Luminária LED de mesa recarregável via USB com regulagem de brilho"

DESCRIÇÃO (escreva corrido, em parágrafos naturais, 250-350 palavras):
- Primeiro parágrafo (gancho): comece pelo PROBLEMA que o produto resolve ou pela situação em que ele é perfeito. Nada de "apresentamos o produto X". Fale direto com o comprador.
- Segundo parágrafo: descreva o produto de forma concreta — materiais, dimensões, como funciona — mas de jeito humano, não técnico frio.
- Terceiro parágrafo: mostre o produto em uso real. "Imagine chegar em casa depois de um dia longo e...". Crie identificação.
- Quarto parágrafo: quebre objeções. Antecipe a dúvida mais comum de quem está na dúvida entre comprar e não comprar, e responda.
- Fechamento: CTA natural, sem gritar. Algo como "Simples assim." ou "É só escolher a cor e a gente cuida do resto."
- NÃO use listas com travessão nessa seção. Parágrafos corridos.
- NÃO use palavras como: incrível, sensacional, imperdível, top, perfeito, revolucionário, exclusivo

BENEFÍCIOS (lista separada, 5 itens):
- Cada benefício deve começar com o RESULTADO, não com a característica
- Ruim: "Material resistente"
- Bom: "Aguenta o uso diário sem deformar — testamos por 6 meses"
- Ruim: "Fácil de usar"
- Bom: "Qualquer pessoa monta em menos de 2 minutos, sem manual"

PALAVRAS-CHAVE:
- Primárias (5): termos exatos que o comprador digita ao buscar esse produto no ${mp.name}
- Secundárias (8): variações, sinônimos, usos, contextos relacionados

VARIAÇÕES:
- Sugira 3 variações de produto (cor, tamanho, versão) que fariam sentido comercialmente

DICA DO MARKETPLACE:
- Uma dica prática e específica sobre como se destacar no ${mp.name} com esse tipo de produto. Baseada em como o algoritmo e os compradores dessa plataforma se comportam.

Retorne APENAS um JSON válido, sem markdown, sem texto antes ou depois, com esta estrutura:
{
  "titulo_otimizado": "...",
  "descricao": "...",
  "beneficios": ["...", "...", "...", "...", "..."],
  "palavras_chave_primarias": ["...", "...", "...", "...", "..."],
  "palavras_chave_secundarias": ["...", "...", "...", "...", "...", "...", "...", "..."],
  "variacoes_sugeridas": ["...", "...", "..."],
  "dica_marketplace": "..."
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const json = await res.json();
      clearInterval(progressInterval);
      setProgress(100);

      const text = json.content?.map(b => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAd(parsed);
      setLoading(false);
    } catch (e) {
      clearInterval(progressInterval);
      setError("Não foi possível conectar à IA. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  const copyField = (key, text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(c => ({ ...c, [key]: true }));
    setTimeout(() => setCopied(c => ({ ...c, [key]: false })), 1800);
  };

  const mp = MARKETPLACES[data.marketplace];
  const result = calculatePrice({
    cost: data.cost, margin: data.margin || 25,
    marketplace: data.marketplace, category: data.category,
    sellerType: data.sellerType || "CPF", useFreight: data.useFreight,
  });

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && (
        <div className="card">
          <div className="loading-bar"><div className="loading-bar-fill" style={{ width: `${progress}%` }} /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="spinner" />
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Criando seu anúncio...</div>
              <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
                {progress < 20 ? "Analisando produto e público-alvo..." :
                 progress < 40 ? "Elaborando título com palavras-chave estratégicas..." :
                 progress < 60 ? "Escrevendo descrição em linguagem natural de vendas..." :
                 progress < 80 ? "Refinando benefícios e gatilhos de conversão..." :
                 "Finalizando palavras-chave e dicas do marketplace..."}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div>
          <div className="alert" style={{ background: "var(--red-pale)", borderLeft: "3px solid var(--red)", color: "var(--red)" }}>
            <span>⚠️</span><span>{error}</span>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generateAd}>Tentar novamente</button>
        </div>
      )}

      {ad && !loading && (
        <>
          <div className="alert success">
            <span>✅</span>
            <span><strong>Anúncio gerado com sucesso!</strong> Revise, personalize e copie cada bloco para publicar no {mp.name}.</span>
          </div>

          <div className="ai-output">
            {/* Title */}
            <div className="ai-block">
              <div className="ai-block-header">
                <div className="ai-block-title"><span>🏷️</span> Título otimizado para SEO</div>
                <CopyButton text={ad.titulo_otimizado} />
              </div>
              <div className="ai-block-body" style={{ fontWeight: 600, fontSize: "1rem" }}>
                <TypingText text={ad.titulo_otimizado} speed={14} />
              </div>
            </div>

            {/* Description */}
            <div className="ai-block">
              <div className="ai-block-header">
                <div className="ai-block-title"><span>📝</span> Descrição</div>
                <CopyButton text={ad.descricao} />
              </div>
              <div className="ai-block-body">
                {ad.descricao
                  ? ad.descricao.split(/\n+/).filter(Boolean).map((para, i) => (
                      <p key={i} style={{ marginBottom: i < ad.descricao.split(/\n+/).filter(Boolean).length - 1 ? "14px" : 0, lineHeight: 1.75 }}>
                        {i === 0 ? <TypingText text={para} speed={5} /> : para}
                      </p>
                    ))
                  : null}
              </div>
            </div>

            <div className="grid-2">
              {/* Benefits */}
              <div className="ai-block">
                <div className="ai-block-header">
                  <div className="ai-block-title"><span>✨</span> Benefícios principais</div>
                  <CopyButton text={(ad.beneficios || []).map((b, i) => `${i + 1}. ${b}`).join("\n")} />
                </div>
                <div className="ai-block-body">
                  {(ad.beneficios || []).map((b, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variations */}
              <div className="ai-block">
                <div className="ai-block-header">
                  <div className="ai-block-title"><span>🔀</span> Variações sugeridas</div>
                </div>
                <div className="ai-block-body">
                  {(ad.variacoes_sugeridas || []).map((v, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "center" }}>
                      <span style={{ background: "var(--border)", borderRadius: 4, padding: "1px 7px", fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)" }}>#{i + 1}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="ai-block">
              <div className="ai-block-header">
                <div className="ai-block-title"><span>🔍</span> Palavras-chave estratégicas</div>
                <CopyButton text={[...(ad.palavras_chave_primarias || []), ...(ad.palavras_chave_secundarias || [])].join(", ")} />
              </div>
              <div className="ai-block-body keywords">
                {(ad.palavras_chave_primarias || []).map((kw, i) => (
                  <span key={i} className="kw-tag primary">{kw}</span>
                ))}
                {(ad.palavras_chave_secundarias || []).map((kw, i) => (
                  <span key={i} className="kw-tag">{kw}</span>
                ))}
              </div>
            </div>

            {/* Marketplace tip */}
            {ad.dica_marketplace && (
              <div className="alert info">
                <span>💡</span><span><strong>Dica para {mp.name}:</strong> {ad.dica_marketplace}</span>
              </div>
            )}
          </div>

          {/* Final summary */}
          {result && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 Resumo financeiro do anúncio</div>
              </div>
              <div className="metric-cards">
                <div className="metric-card dark">
                  <div className="m-label">Preço de publicação</div>
                  <div className="m-value">{fmtPos(data.finalPrice || result.recommended.price)}</div>
                  <div className="m-sub">{mp.name}</div>
                </div>
                <div className="metric-card green">
                  <div className="m-label">Lucro por venda</div>
                  <div className="m-value">{fmtPos(data.finalProfit != null ? data.finalProfit : result.recommended.profit)}</div>
                  <div className="m-sub">publicando a {fmtPos(data.finalPrice || result.recommended.price)}</div>
                </div>
                <div className="metric-card orange">
                  <div className="m-label">10 vendas = lucro de</div>
                  <div className="m-value">{fmtPos((data.finalProfit != null ? data.finalProfit : result.recommended.profit) * 10)}</div>
                  <div className="m-sub">Simulação de volume</div>
                </div>
              </div>
            </div>
          )}

          <div className="final-publish">
            <div className="fp-text">
              <h3>🚀 Pronto para publicar!</h3>
              <p>Copie os textos acima e publique no {mp.name} com confiança.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-ghost" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff" }} onClick={generateAd}>🔄 Regenerar</button>
              <button className="btn-publish" onClick={onRestart}>+ Novo anúncio</button>
            </div>
          </div>
        </>
      )}

      {!loading && !error && !ad && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button className="btn btn-ghost" onClick={onBack}>← Voltar</button>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    marketplace: "",
    images: [],
    title: "",
    category: "",
    brand: "",
    description: "",
    cost: 0,
    margin: 25,
    sellerType: "CPF",
    useFreight: true,
    chosenPrice: null,
    finalPrice: null,
  });

  const update = useCallback((patch) => {
    setFormData(d => ({ ...d, ...patch }));
  }, []);

  const restart = () => {
    setStep(1);
    setFormData({ marketplace: "", images: [], title: "", category: "", brand: "", description: "", cost: 0, margin: 25, sellerType: "CPF", useFreight: true, chosenPrice: null, finalPrice: null });
  };

  const stepStatus = (s) => {
    if (s < step) return "done";
    if (s === step) return "active";
    return "todo";
  };

  const topbarTitles = ["", "Escolha o Marketplace", "Dados do Produto", "Precificação & Simulação", "Geração de Anúncio com IA"];

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo">Anúncio<span>Pro</span></div>
          <div className="sidebar-section-label">Criar anúncio</div>
          {STEPS.map(s => {
            const status = stepStatus(s.id);
            const clickable = step > s.id;
            return (
              <div
                key={s.id}
                className={`sidebar-item ${step === s.id ? "active" : ""}`}
                onClick={() => clickable && setStep(s.id)}
                style={{ cursor: clickable ? "pointer" : "default", opacity: step < s.id ? 0.38 : 1 }}
              >
                <span className="s-icon" style={{ fontSize: "0.75rem" }}>
                  {status === "done" ? "✓" : step === s.id ? "▶" : s.id}
                </span>
                <div className="s-text">
                  <div className="s-name">{s.name}</div>
                  <div className="s-desc">{s.desc}</div>
                </div>
              </div>
            );
          })}
          <div className="sidebar-spacer" />
          <div className="sidebar-section-label">Conta</div>
          <div className="sidebar-item">
            <span className="s-icon">☰</span>
            <div className="s-text"><div className="s-name">Meus anúncios</div></div>
          </div>
          <div className="sidebar-item">
            <span className="s-icon">⚙</span>
            <div className="s-text"><div className="s-name">Configurações</div></div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <div className="topbar">
            <div className="topbar-title">{topbarTitles[step]}</div>
            <div className="topbar-actions">
              {step > 1 && <button className="btn btn-ghost btn-sm" onClick={restart}>✕ Cancelar</button>}
              <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Passo {step} de {STEPS.length}</div>
            </div>
          </div>

          <div className="content-area">
            {/* Progress */}
            <div className="step-progress">
              {STEPS.map((s, i) => {
                const status = stepStatus(s.id);
                return (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                    <div className="step-node">
                      <div className={`step-circle ${status}`}>
                        {status === "done" ? "✓" : s.id}
                      </div>
                      <div className="step-info">
                        <div className={`step-name ${status}`}>{s.name}</div>
                        <div className="step-desc">{s.desc}</div>
                      </div>
                    </div>
                    {i < STEPS.length - 1 && <div className="step-connector" />}
                  </div>
                );
              })}
            </div>

            {/* Step content */}
            {step === 1 && <StepMarketplace data={formData} onChange={update} onNext={() => setStep(2)} />}
            {step === 2 && <StepProduct data={formData} onChange={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
            {step === 3 && <StepPricing data={formData} onChange={update} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
            {step === 4 && <StepAd data={formData} onBack={() => setStep(3)} onRestart={restart} />}
          </div>
        </main>
      </div>
    </>
  );
}
