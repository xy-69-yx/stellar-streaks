"use client";

import { useCallback, useEffect, useState } from "react";

import { config } from "@/lib/config";
import {
  KitEventType,
  StellarWalletsKit,
  initWalletKit,
  setKitHandle,
} from "@/lib/wallet/kit";

export type WalletState = {
  publicKey: string | null;
  walletId: string | null;
  walletNetwork: string | null;
  appNetwork: string;
  networkMatches: boolean;
  ready: boolean;
};

const initialWalletState: WalletState = {
  publicKey: null,
  walletId: null,
  walletNetwork: null,
  appNetwork: config.network,
  networkMatches: true,
  ready: false,
};

type WalletListener = () => void;

let sharedWalletState: WalletState = initialWalletState;
let sharedNativeBalance: string | null = null;
let kitReady = false;
let kitListenersBound = false;
const walletListeners = new Set<WalletListener>();

function emitWalletState() {
  for (const listener of walletListeners) {
    listener();
  }
}

function patchWalletState(patch: Partial<WalletState>) {
  sharedWalletState = { ...sharedWalletState, ...patch };
  emitWalletState();
}

function setNativeBalance(balance: string | null) {
  sharedNativeBalance = balance;
  emitWalletState();
}

function subscribeWallet(listener: WalletListener): () => void {
  walletListeners.add(listener);
  return () => {
    walletListeners.delete(listener);
  };
}

async function ensureKitRuntime(): Promise<void> {
  if (kitReady) return;

  initWalletKit();
  setKitHandle({
    signTransaction: (xdr, opts) =>
      StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase ?? config.networkPassphrase,
        address: opts?.address,
      }),
  });

  if (!kitListenersBound) {
    kitListenersBound = true;

    StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      patchWalletState({ walletId: event.payload.id ?? null });
    });

    StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const walletNetwork = event.payload.networkPassphrase ?? null;
      patchWalletState({
        publicKey: event.payload.address ?? null,
        walletNetwork,
        networkMatches: walletNetwork
          ? walletNetwork.toLowerCase() ===
            config.networkPassphrase.toLowerCase()
          : true,
        ready: true,
      });
    });
  }

  try {
    const { address } = await StellarWalletsKit.getAddress();
    patchWalletState({ publicKey: address, ready: true });
  } catch {
    patchWalletState({ publicKey: null, ready: true });
  }

  kitReady = true;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>(sharedWalletState);
  const [nativeBalance, setNativeBalanceState] = useState<string | null>(
    sharedNativeBalance,
  );

  const refreshBalance = useCallback(async () => {
    if (!sharedWalletState.publicKey) {
      setNativeBalance(null);
      return;
    }

    try {
      const response = await fetch(
        `${config.horizonUrl}/accounts/${sharedWalletState.publicKey}`,
      );
      if (!response.ok) {
        setNativeBalance(null);
        return;
      }
      const data = (await response.json()) as {
        balances?: Array<{ asset_type?: string; balance?: string }>;
      };
      const native = data.balances?.find((balance) => balance.asset_type === "native");
      setNativeBalance(native?.balance ?? "0");
    } catch {
      setNativeBalance(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeWallet(() => {
      setWallet(sharedWalletState);
      setNativeBalanceState(sharedNativeBalance);
    });

    void ensureKitRuntime().catch(() => {
      patchWalletState({ ready: true });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance, wallet.publicKey]);

  const connect = useCallback(async () => {
    await ensureKitRuntime();
    const { address } = await StellarWalletsKit.authModal();
    patchWalletState({ publicKey: address ?? null, ready: true });
    await refreshBalance();
    return address;
  }, [refreshBalance]);

  const disconnect = useCallback(async () => {
    await ensureKitRuntime();
    await StellarWalletsKit.disconnect();
    patchWalletState({
      publicKey: null,
      walletId: null,
      walletNetwork: null,
      networkMatches: true,
      ready: true,
    });
    setNativeBalance(null);
    kitReady = false;
  }, []);

  const warmup = useCallback(async () => {
    await ensureKitRuntime();
  }, []);

  return {
    wallet,
    nativeBalance,
    connect,
    disconnect,
    warmup,
    refreshBalance,
  };
}
