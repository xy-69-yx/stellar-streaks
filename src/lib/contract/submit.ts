"use client";

import {
  Address,
  Transaction,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

import { config } from "@/lib/config";
import { getKitHandle } from "@/lib/wallet/kit";

import { contract, getRpc } from "./client";

export type InvokeArg = { name: string; value: unknown };

function toScVal(name: string, value: unknown): xdr.ScVal {
  switch (name) {
    case "admin":
    case "participant":
      return new Address(String(value)).toScVal();
    case "name":
      return nativeToScVal(String(value), { type: "string" });
    case "weekly_target":
    case "committed_weekly":
    case "amount":
      return nativeToScVal(BigInt(String(value)), { type: "i128" });
    case "duration_weeks":
    case "week_number":
      return nativeToScVal(Number(value), { type: "u32" });
    default:
      throw new Error(`Unsupported contract arg: ${name}`);
  }
}

export class ContractCallError extends Error {
  code: number | null;

  constructor(message: string, code: number | null = null) {
    super(message);
    this.name = "ContractCallError";
    this.code = code;
  }
}

export async function submitSavingsCall(
  method: string,
  args: InvokeArg[],
  publicKey: string,
): Promise<{
  hash: string;
  wait: () => Promise<rpc.Api.GetSuccessfulTransactionResponse>;
}> {
  const scArgs = args.map((arg) => toScVal(arg.name, arg.value));
  const operation = contract().call(method, ...scArgs);
  const account = await getRpc().getAccount(publicKey);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      operation as unknown as Parameters<
        typeof TransactionBuilder.prototype.addOperation
      >[0],
    )
    .setTimeout(120)
    .build();

  const prepared = await getRpc().prepareTransaction(tx);
  const { signedTxXdr } = await getKitHandle().signTransaction(
    prepared.toXDR(),
    {
      networkPassphrase: config.networkPassphrase,
      address: publicKey,
    },
  );

  const signed = TransactionBuilder.fromXDR(
    signedTxXdr,
    config.networkPassphrase,
  ) as Transaction;
  const sent = await getRpc().sendTransaction(signed);
  const hash = (sent as { hash?: string }).hash ?? "";

  return {
    hash,
    wait: () => awaitTransaction(hash),
  };
}

async function awaitTransaction(
  hash: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
  const intervalMs = opts.intervalMs ?? 2000;
  const timeoutMs = opts.timeoutMs ?? 60000;
  const start = Date.now();

  while (true) {
    const response = await getRpc().getTransaction(hash);
    if (response.status === "SUCCESS") {
      return response as rpc.Api.GetSuccessfulTransactionResponse;
    }
    if (response.status === "FAILED") {
      const failed = response as rpc.Api.GetFailedTransactionResponse;
      const { code, detail } = extractContractError(failed);
      throw new ContractCallError(
        code != null ? `Contract error #${code}: ${detail}` : detail,
        code,
      );
    }
    if (Date.now() - start > timeoutMs) {
      throw new ContractCallError(`Transaction ${hash} timed out.`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

function extractContractError(
  failed: rpc.Api.GetFailedTransactionResponse,
): { code: number | null; detail: string } {
  const result: unknown =
    (failed as { result?: unknown }).result ??
    (failed as { resultXdr?: unknown }).resultXdr ??
    (failed as { resultMetaXdr?: unknown }).resultMetaXdr;
  const detail = String(result);
  const match = detail.match(/Error\(Contract,\s*#(\d+)\)/) ?? detail.match(/#(\d+)/);
  if (!match) {
    return { code: null, detail };
  }
  const code = Number(match[1]);
  return { code: Number.isFinite(code) ? code : null, detail };
}
