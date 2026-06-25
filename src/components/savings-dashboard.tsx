"use client";

import { useEffect, useMemo, useState } from "react";

import { config } from "@/lib/config";
import { deployment } from "@/lib/deployment";
import { describeContractError } from "@/lib/contract/errors";
import { savingsContract, type ChallengeConfig, type SavingsSummary } from "@/lib/contract/savings";
import {
  ContractCallError,
  submitSavingsCall,
} from "@/lib/contract/submit";
import { useWallet } from "@/hooks/useWallet";

type TxState = "idle" | "pending" | "success" | "failed";

function formatAddress(value: string | null) {
  if (!value) return "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function formatXlm(value: string | null | undefined) {
  if (!value) return "0 XLM";
  const number = Number(value);
  if (!Number.isFinite(number)) return `${value} XLM`;
  return `${number.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM`;
}

function formatHash(value: string) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

export function SavingsDashboard() {
  const { wallet, nativeBalance, connect, disconnect, refreshBalance, warmup } =
    useWallet();

  const [contractConfig, setContractConfig] = useState<ChallengeConfig | null>(null);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: TxState; message: string }>({
    kind: "idle",
    message: "Connect a wallet, join once, then record weekly savings on-chain.",
  });
  const [joinAmount, setJoinAmount] = useState("5");
  const [saveAmount, setSaveAmount] = useState("5");
  const [weekNumber, setWeekNumber] = useState("1");

  const totalPlanProgress = useMemo(() => {
    if (!contractConfig || !summary) return 0;
    const total = Number(summary.total_saved);
    const target = Number(summary.committed_weekly) * contractConfig.duration_weeks;
    if (!Number.isFinite(total) || !Number.isFinite(target) || target <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((total / target) * 100)));
  }, [contractConfig, summary]);

  const currentTargetProgress = useMemo(() => {
    if (!summary) return 0;
    const total = Number(summary.total_saved);
    const committed = Number(summary.committed_weekly);
    if (!Number.isFinite(total) || !Number.isFinite(committed) || committed <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round((total / committed) * 100)));
  }, [summary]);

  const challengeMinimum = contractConfig?.weekly_target ?? null;
  const personalCommitment = summary?.committed_weekly ?? null;
  const remainingToCommitment = useMemo(() => {
    if (!summary) return null;
    const total = Number(summary.total_saved);
    const committed = Number(summary.committed_weekly);
    if (!Number.isFinite(total) || !Number.isFinite(committed)) return null;
    return Math.max(committed - total, 0).toString();
  }, [summary]);
  const nextWeekHint = summary
    ? "Enter a week number greater than your last submitted week."
    : "Join first to start tracking weekly deposits.";

  async function loadContractState(address?: string | null) {
    setIsLoading(true);
    setReadError(null);
    try {
      const nextConfig = await savingsContract.getConfig();
      setContractConfig(nextConfig);
      setJoinAmount((current) => {
        if (!current || current === "5") {
          return nextConfig.weekly_target;
        }
        return current;
      });

      if (address) {
        try {
          const nextSummary = await savingsContract.getSummary(address);
          setSummary(nextSummary);
          setJoinAmount(nextSummary.committed_weekly);
        } catch (error) {
          const message = String(error);
          if (message.includes("#5") || message.toLowerCase().includes("participantnotjoined")) {
            setSummary(null);
          } else {
            throw error;
          }
        }
      } else {
        setSummary(null);
      }
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "Failed to load contract state.");
      setContractConfig(null);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void warmup();
  }, [warmup]);

  useEffect(() => {
    void loadContractState(wallet.publicKey);
  }, [wallet.publicKey]);

  const isJoined = Boolean(summary);

  async function handleConnect() {
    try {
      setStatus({ kind: "pending", message: "Opening Stellar Wallet Kit..." });
      await connect();
      await refreshBalance();
      setStatus({ kind: "success", message: "Wallet connected. Loading your challenge state..." });
    } catch (error) {
      setStatus({
        kind: "failed",
        message: error instanceof Error ? error.message : "Wallet connection failed.",
      });
    }
  }

  async function handleDisconnect() {
    await disconnect();
    setStatus({ kind: "idle", message: "Wallet disconnected." });
  }

  async function handleJoin() {
    if (!wallet.publicKey) {
      setStatus({ kind: "failed", message: "Connect a wallet first." });
      return;
    }
    try {
      setStatus({ kind: "pending", message: "Waiting for wallet signature..." });
      const tx = await submitSavingsCall(
        "join",
        [
          { name: "participant", value: wallet.publicKey },
          { name: "committed_weekly", value: joinAmount },
        ],
        wallet.publicKey,
      );
      setStatus({
        kind: "pending",
        message: `Join transaction submitted: ${formatHash(tx.hash)}. Waiting for confirmation...`,
      });
      await tx.wait();
      await loadContractState(wallet.publicKey);
      setStatus({ kind: "success", message: `Joined successfully with a ${formatXlm(joinAmount)} weekly commitment.` });
    } catch (error) {
      const message =
        error instanceof ContractCallError
          ? describeContractError(error.code) || error.message
          : error instanceof Error
            ? error.message
            : "Join failed.";
      setStatus({ kind: "failed", message });
    }
  }

  async function handleRecordSavings() {
    if (!wallet.publicKey) {
      setStatus({ kind: "failed", message: "Connect a wallet first." });
      return;
    }
    try {
      setStatus({ kind: "pending", message: "Waiting for wallet signature..." });
      const tx = await submitSavingsCall(
        "record_savings",
        [
          { name: "participant", value: wallet.publicKey },
          { name: "amount", value: saveAmount },
          { name: "week_number", value: weekNumber },
        ],
        wallet.publicKey,
      );
      setStatus({
        kind: "pending",
        message: `Savings transaction submitted: ${formatHash(tx.hash)}. Waiting for confirmation...`,
      });
      await tx.wait();
      await loadContractState(wallet.publicKey);
      setStatus({
        kind: "success",
        message: `Recorded ${formatXlm(saveAmount)} for week ${weekNumber}.`,
      });
    } catch (error) {
      const message =
        error instanceof ContractCallError
          ? describeContractError(error.code) || error.message
          : error instanceof Error
            ? error.message
            : "Savings update failed.";
      setStatus({ kind: "failed", message });
    }
  }

  return (
    <main className="page-shell">
      <div className="aurora" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <div className="brand__mark">S</div>
          <div>
            <span>Stellar Streaks</span>
            <small>{config.network} savings challenge</small>
          </div>
        </div>
        <nav className="topbar__nav">
          <a href="#wallet">Wallet</a>
          <a href="#summary">Summary</a>
          <a href="#actions">Actions</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <div className="hero__eyebrow">Live Soroban Challenge</div>
          <h1>Understand exactly what the contract is tracking.</h1>
          <p>
            The challenge has a minimum weekly target set on-chain. Your wallet
            can then join with its own personal weekly commitment. Those are
            different values, and the dashboard now shows them separately.
          </p>
          <div className="hero__actions">
            <a
              className="primary-button"
              href={deployment.stellarLabUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open contract
            </a>
            <button className="secondary-button" onClick={() => void loadContractState(wallet.publicKey)} type="button">
              Refresh state
            </button>
          </div>
        </div>

        <div className="hero__stats">
          <article className="stat-card stat-card--accent">
            <span>Progress toward your current target</span>
            <strong>{currentTargetProgress}%</strong>
          </article>
          <article className="stat-card">
            <span>Challenge minimum</span>
            <strong>{formatXlm(challengeMinimum)}</strong>
          </article>
          <article className="stat-card">
            <span>Your commitment</span>
            <strong>{summary ? formatXlm(personalCommitment) : "Not joined"}</strong>
          </article>
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="panel panel--callout">
          <div className="panel__eyebrow">How To Read This</div>
          <h2>Two numbers matter</h2>
          <div className="explain-grid">
            <article className="explain-card">
              <strong>Challenge minimum</strong>
              <p>
                This is the contract-wide floor. Right now it is{" "}
                {formatXlm(challengeMinimum)}.
              </p>
            </article>
            <article className="explain-card">
              <strong>Your commitment</strong>
              <p>
                This is what your wallet joined with. If you entered 50 XLM and
                joined successfully, this card should show 50 XLM.
              </p>
            </article>
          </div>
        </section>

        <section className="panel panel--callout">
          <div className="panel__eyebrow">Current Wallet State</div>
          <h2>Where you stand right now</h2>
          <div className="summary-list">
            <div>
              <span>Wallet</span>
              <strong>{formatAddress(wallet.publicKey)}</strong>
            </div>
            <div>
              <span>Joined</span>
              <strong>{isJoined ? "Yes" : "No"}</strong>
            </div>
            <div>
              <span>Total saved</span>
              <strong>{formatXlm(summary?.total_saved)}</strong>
            </div>
            <div>
              <span>Left to hit current target</span>
              <strong>{summary ? formatXlm(remainingToCommitment) : "0 XLM"}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="dashboard-grid">
        <section className="panel" id="wallet">
          <div className="panel__eyebrow">Wallet</div>
          <h2>Connect your Stellar wallet</h2>
          <div className="wallet-metrics">
            <div>
              <dt>Status</dt>
              <dd>{wallet.publicKey ? "Connected" : wallet.ready ? "Ready" : "Loading"}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{formatAddress(wallet.publicKey)}</dd>
            </div>
            <div>
              <dt>Balance</dt>
              <dd>{formatXlm(nativeBalance)}</dd>
            </div>
          </div>
          <p className="supporting-copy">
            Wallet Kit supports Freighter, xBull, Albedo, and other compatible
            Stellar wallets. Use Testnet for this deployed contract.
          </p>
          {!wallet.networkMatches ? (
            <p className="status-banner status-banner--failed">
              Wallet network does not match the app network.
            </p>
          ) : null}
          <div className="hero__actions">
            {wallet.publicKey ? (
              <button className="primary-button" onClick={handleDisconnect} type="button">
                Disconnect wallet
              </button>
            ) : (
              <button className="primary-button" onClick={handleConnect} type="button">
                Connect wallet
              </button>
            )}
            <button className="secondary-button" onClick={() => void refreshBalance()} type="button">
              Refresh balance
            </button>
          </div>
        </section>

        <section className="panel" id="summary">
          <div className="panel__eyebrow">Challenge State</div>
          <h2>Live on-chain summary</h2>
          {isLoading ? <p className="supporting-copy">Loading contract state...</p> : null}
          {readError ? (
            <p className="status-banner status-banner--failed">{readError}</p>
          ) : null}
          <div className="contract-cards">
            <article>
              <strong>Challenge</strong>
              <p className="value-wrap">{contractConfig?.name ?? "Unavailable"}</p>
            </article>
            <article>
              <strong>Duration</strong>
              <p>{contractConfig ? `${contractConfig.duration_weeks} weeks` : "Unavailable"}</p>
            </article>
            <article>
              <strong>Current streak</strong>
              <p>{summary ? `${summary.current_streak} weeks` : "Not joined"}</p>
            </article>
            <article>
              <strong>Best streak</strong>
              <p>{summary ? `${summary.best_streak} weeks` : "Not joined"}</p>
            </article>
            <article>
              <strong>Your weekly commitment</strong>
              <p>{summary ? formatXlm(summary.committed_weekly) : "Join required"}</p>
            </article>
            <article>
              <strong>Badges earned</strong>
              <p>{summary ? String(summary.badge_count) : "Not joined"}</p>
            </article>
          </div>
          <div className="progress-card">
            <div className="progress-card__label">
              Progress toward your current weekly commitment
            </div>
            <div
              className="progress-track"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={currentTargetProgress}
              role="progressbar"
            >
              <div className="progress-fill" style={{ width: `${currentTargetProgress}%` }} />
            </div>
            <div className="progress-meta">
              <span>{currentTargetProgress}% of {formatXlm(summary?.committed_weekly)}</span>
              <span>
                {summary
                  ? `${formatXlm(remainingToCommitment)} left to reach your current target`
                  : "Join to calculate your target progress"}
              </span>
            </div>
          </div>
          <div className="progress-card progress-card--secondary">
            <div className="progress-card__label">
              Progress across the full {contractConfig?.duration_weeks ?? 0}-week plan
            </div>
            <div
              className="progress-track"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={totalPlanProgress}
              role="progressbar"
            >
              <div className="progress-fill" style={{ width: `${totalPlanProgress}%` }} />
            </div>
            <div className="progress-meta">
              <span>{totalPlanProgress}% complete overall</span>
              <span>
                {summary
                  ? `Next badge milestone at ${formatXlm(summary.next_badge_at)}`
                  : "Join to calculate your next badge"}
              </span>
            </div>
          </div>
        </section>
      </section>

      <section className="content-grid" id="actions">
        <section className="panel">
          <div className="panel__eyebrow">Join Challenge</div>
          <h2>Choose your personal weekly commitment</h2>
          <p className="supporting-copy">
            The contract minimum is {formatXlm(challengeMinimum)}. You can join
            with any amount at or above that value.
          </p>
          <label className="field">
            <span>Weekly amount in XLM</span>
            <input
              className="field__input"
              inputMode="decimal"
              min="0"
              onChange={(event) => setJoinAmount(event.target.value)}
              value={joinAmount}
            />
          </label>
          {isJoined ? (
            <p className="status-banner status-banner--idle">
              This wallet already joined with {formatXlm(summary?.committed_weekly)}.
              The current contract does not let a participant change that commitment later.
            </p>
          ) : null}
          <button
            className="primary-button"
            disabled={!wallet.publicKey || isJoined}
            onClick={handleJoin}
            type="button"
          >
            {isJoined ? "Already joined" : "Join challenge"}
          </button>
        </section>

        <section className="panel">
          <div className="panel__eyebrow">Record Savings</div>
          <h2>Record a weekly savings deposit</h2>
          <p className="supporting-copy">{nextWeekHint}</p>
          <label className="field">
            <span>Amount in XLM</span>
            <input
              className="field__input"
              inputMode="decimal"
              min="0"
              onChange={(event) => setSaveAmount(event.target.value)}
              value={saveAmount}
            />
          </label>
          <label className="field">
            <span>Week number</span>
            <input
              className="field__input"
              inputMode="numeric"
              min="1"
              onChange={(event) => setWeekNumber(event.target.value)}
              value={weekNumber}
            />
          </label>
          <p className="mini-note">
            The contract only accepts a week number greater than your previous submission.
          </p>
          <button
            className="primary-button"
            disabled={!wallet.publicKey || !isJoined}
            onClick={handleRecordSavings}
            type="button"
          >
            Record savings
          </button>
        </section>
      </section>

      <section className="panel">
        <div className="panel__eyebrow">Deployment</div>
        <h2>Contract metadata</h2>
        <div className="contract-cards">
          <article>
            <strong>Contract id</strong>
            <p className="value-wrap">{deployment.contractId}</p>
          </article>
          <article>
            <strong>WASM hash</strong>
            <p className="value-wrap">{deployment.wasmHash}</p>
          </article>
          <article>
            <strong>Deploy tx</strong>
            <p className="value-wrap">{deployment.deployTxHash}</p>
          </article>
          <article>
            <strong>Source account</strong>
            <p>{deployment.sourceAccount}</p>
          </article>
        </div>
        <p
          className={`status-banner ${
            status.kind === "failed"
              ? "status-banner--failed"
              : status.kind === "success"
                ? "status-banner--success"
                : "status-banner--idle"
          }`}
        >
          {status.message}
        </p>
      </section>
    </main>
  );
}
