// screens_FactionService.jsx — Dutch Bank, Spanish Inquisitor, French Embassy
window.S = window.S || {};

(() => {
  const { useState, useMemo } = React;
  const { PORTS, FACTIONS } = window.D;
  const L = window.L;
  const A = window.E.A;
  const G = window.G;
  const { T, panelStyle, Bar, Pill, Btn, SectionTitle, EmptyState, BackButton, Panel, Tooltip, IconLock, StatBlock } = window.UI;

  // ── Dutch Bank ─────────────────────────────────────────────────
  function BankScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const rep = state.reputation[state.currentPort] ?? 50;
    const debt = state.bankDebt ?? 0;
    const capacity = L.getBankCapacity(state, state.currentPort);
    const interestRate = L.getBankInterestRate(state, state.currentPort);

    const flavour = useMemo(() => G.generateBankFlavour(state), [state.gold, debt, rep, state.currentPort]);

    const [loanAmount, setLoanAmount] = useState("");
    const [repayAmount, setRepayAmount] = useState("");

    const canTakeLoan = debt === 0 && parseInt(loanAmount) > 0 && parseInt(loanAmount) <= capacity && rep >= D.SERVICE_THRESHOLDS.bank.repRequired;
    const canRepay = debt > 0 && parseInt(repayAmount) > 0 && parseInt(repayAmount) <= state.gold && parseInt(repayAmount) <= debt;

    const takeLoanTooltip = !canTakeLoan
      ? debt > 0
        ? "Already have an outstanding loan"
        : !loanAmount || parseInt(loanAmount) <= 0
          ? "Enter a positive amount"
          : parseInt(loanAmount) > capacity
            ? `Cannot borrow more than ${capacity}g`
            : ""
      : "";

    const repayTooltip = !canRepay
      ? debt <= 0
        ? "No debt to repay"
        : !repayAmount || parseInt(repayAmount) <= 0
          ? "Enter a positive amount"
          : parseInt(repayAmount) > state.gold
            ? "Not enough gold"
            : parseInt(repayAmount) > debt
              ? "Enter amount up to remaining debt"
              : ""
      : "";

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <BackButton dispatch={dispatch} />
        <Panel color={T.gold}>
          <SectionTitle>Dutch Bank – {port.name}</SectionTitle>
          <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, fontStyle: "italic", margin: "0 0 8px" }}>{flavour}</p>
          <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 12 }}>
            <StatBlock label="Dutch Rep" value={rep} />
            <StatBlock label="Loan Capacity" value={`${Math.floor(capacity)}g`} />
            <StatBlock label="Current Debt" value={`${debt}g`} />
            <StatBlock label="Interest Rate" value={`${Math.round(interestRate * 100)}%`} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Take a Loan</SectionTitle>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              placeholder="Amount"
              style={{ width: 120, background: T.panel, border: `1px solid ${T.border}`, color: T.text, borderRadius: 2, padding: 6, fontSize: T.metadataFontSize, minHeight: 32 }}
            />
            <Tooltip text={takeLoanTooltip}>
              <Btn
                v="gold"
                disabled={!canTakeLoan}
                onClick={() => {
                  dispatch({ type: A.TAKE_LOAN, amount: parseInt(loanAmount) });
                  setLoanAmount("");
                }}
              >
                Borrow
              </Btn>
            </Tooltip>
            {!canTakeLoan && takeLoanTooltip && (
              <div style={{ color: T.redBr, fontSize: T.captionFontSize }}>{takeLoanTooltip}</div>
            )}
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Repay Loan</SectionTitle>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              value={repayAmount}
              onChange={e => setRepayAmount(e.target.value)}
              placeholder="Amount"
              style={{ width: 120, background: T.panel, border: `1px solid ${T.border}`, color: T.text, borderRadius: 2, padding: 6, fontSize: T.metadataFontSize, minHeight: 32 }}
            />
            <Tooltip text={repayTooltip}>
              <Btn
                v="default"
                disabled={!canRepay}
                onClick={() => {
                  dispatch({ type: A.REPAY_LOAN, amount: parseInt(repayAmount) });
                  setRepayAmount("");
                }}
              >
                Repay
              </Btn>
            </Tooltip>
            {!canRepay && repayTooltip && (
              <div style={{ color: T.redBr, fontSize: T.captionFontSize }}>{repayTooltip}</div>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  // ── Spanish Inquisitor ─────────────────────────────────────────
  function InquisitorScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const rep = state.reputation[state.currentPort] ?? 50;
    const infamy = state.infamy ?? 0;
    const cost = L.getInquisitorCost(state);
    const usedThisVisit = state.inquisitorUsedThisVisit || false;

    const flavour = useMemo(() => G.generateInquisitorFlavour(state), [infamy, state.fame, state.currentPort]);

    const canPay = infamy > 0 && state.gold >= cost && !usedThisVisit;

    const tooltip = !canPay
      ? infamy <= 0
        ? "No infamy to reduce"
        : usedThisVisit
          ? "You have already used the Inquisitor this visit"
          : state.gold < cost
            ? `Need ${cost - state.gold}g more`
            : ""
      : "";

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <BackButton dispatch={dispatch} />
        <Panel color={T.gold}>
          <SectionTitle>Spanish Inquisitor – {port.name}</SectionTitle>
          <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, fontStyle: "italic", margin: "0 0 8px" }}>{flavour}</p>
          <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 12 }}>
            <StatBlock label="Spanish Rep" value={rep} />
            <StatBlock label="Infamy" value={infamy} />
            <StatBlock label="Cost to Absolve" value={`${cost}g`} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Absolution</SectionTitle>
          <Tooltip text={tooltip}>
            <Btn
              v={canPay ? "gold" : "ghost"}
              disabled={!canPay}
              onClick={() => dispatch({ type: A.PAY_INQUISITOR })}
            >
              Pay {cost}g – Reduce Infamy by 1
            </Btn>
          </Tooltip>
          {!canPay && tooltip && (
            <div style={{ color: T.redBr, fontSize: T.captionFontSize, marginTop: 6 }}>{tooltip}</div>
          )}
        </Panel>
      </div>
    );
  }

  // ── French Embassy ─────────────────────────────────────────────
  function EmbassyScreen({ state, dispatch }) {
    const port = PORTS[state.currentPort];
    const frenchRep = state.reputation[state.currentPort] ?? 50;
    const [targetFaction, setTargetFaction] = useState("spanish");

    const targetRep = L.getFactionReputation(state, targetFaction);
    const cost = L.getEmbassyCost(state, targetFaction);
    const flavour = useMemo(() => G.generateEmbassyFlavour(state, targetFaction), [frenchRep, targetRep, targetFaction, state.currentPort]);

    const canBuy = targetRep < 100 && state.gold >= cost;

    const tooltip = !canBuy
      ? targetRep >= 100
        ? "Already at maximum reputation"
        : state.gold < cost
          ? `Need ${cost - state.gold}g more`
          : ""
      : "";

    const factionOptions = Object.keys(FACTIONS).map(f => ({ value: f, label: FACTIONS[f].label }));

    return (
      <div style={{ padding: T.spacing.lg, display: "flex", flexDirection: "column", gap: T.spacing.md, overflowY: "auto", flex: 1 }}>
        <BackButton dispatch={dispatch} />
        <Panel color={T.gold}>
          <SectionTitle>French Embassy – {port.name}</SectionTitle>
          <p style={{ color: T.textDim, fontSize: T.narrativeFontSize, fontStyle: "italic", margin: "0 0 8px" }}>{flavour}</p>
          <div style={{ display: "flex", gap: T.spacing.lg, flexWrap: "wrap", marginBottom: 12 }}>
            <StatBlock label="French Rep" value={frenchRep} />
            <StatBlock label="Target Faction" value={FACTIONS[targetFaction].label} />
            <StatBlock label="Target Rep" value={targetRep} />
            <StatBlock label="Cost for +5" value={`${cost}g`} />
          </div>
        </Panel>

        <Panel>
          <SectionTitle>Improve Reputation</SectionTitle>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
            <select
              value={targetFaction}
              onChange={e => setTargetFaction(e.target.value)}
              style={{ background: T.panel, border: `1px solid ${T.border}`, color: T.text, borderRadius: 2, padding: 6, fontSize: T.metadataFontSize, minHeight: 32 }}
            >
              {factionOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <Tooltip text={tooltip}>
              <Btn
                v={canBuy ? "gold" : "ghost"}
                disabled={!canBuy}
                onClick={() => dispatch({ type: A.PURCHASE_EMBASSY_REP, targetFaction })}
              >
                Purchase +5 Reputation ({cost}g)
              </Btn>
            </Tooltip>
            {!canBuy && tooltip && (
              <div style={{ color: T.redBr, fontSize: T.captionFontSize }}>{tooltip}</div>
            )}
          </div>
        </Panel>
      </div>
    );
  }

  Object.assign(window.S, { BankScreen, InquisitorScreen, EmbassyScreen });
})();