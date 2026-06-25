"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import {
  KitEventType,
  Networks,
} from "@creit.tech/stellar-wallets-kit/types";

import { config } from "@/lib/config";

export type KitLike = {
  signTransaction: (
    xdr: string,
    opts?: { networkPassphrase?: string; address?: string },
  ) => Promise<{ signedTxXdr: string; signerAddress?: string }>;
};

let initialized = false;
let current: KitLike | null = null;

export function resolveKitNetwork(): Networks {
  switch (config.network.toLowerCase()) {
    case "mainnet":
    case "public":
      return Networks.PUBLIC;
    case "futurenet":
      return Networks.FUTURENET;
    case "testnet":
    default:
      return Networks.TESTNET;
  }
}

export function initWalletKit(): void {
  if (initialized) return;

  StellarWalletsKit.init({
    modules: defaultModules(),
    network: resolveKitNetwork(),
    authModal: {
      hideUnsupportedWallets: false,
      showInstallLabel: true,
    },
  });

  initialized = true;
}

export function setKitHandle(handle: KitLike | null): void {
  current = handle;
}

export function getKitHandle(): KitLike {
  if (!current) {
    throw new Error("Wallet kit is not initialized.");
  }
  return current;
}

export { KitEventType, Networks, StellarWalletsKit };
