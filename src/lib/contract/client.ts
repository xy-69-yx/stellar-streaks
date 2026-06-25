import {
  Address,
  Contract,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

import { config } from "@/lib/config";

let rpcClient: rpc.Server | null = null;

export function getRpc(): rpc.Server {
  if (!rpcClient) {
    rpcClient = new rpc.Server(config.rpcUrl, { allowHttp: false });
  }
  return rpcClient;
}

export function contract(id: string = config.contractId): Contract {
  return new Contract(id);
}

function bigintsToStrings(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(bigintsToStrings);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = bigintsToStrings(nested);
    }
    return out;
  }
  return value;
}

export async function readContract<T = unknown>(
  method: string,
  args: xdr.ScVal[] = [],
): Promise<T> {
  const source = new Address(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  );
  const account = await getRpc().getAccount(source.toString());
  const operation = contract().call(method, ...args);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      operation as unknown as Parameters<
        typeof TransactionBuilder.prototype.addOperation
      >[0],
    )
    .setTimeout(30)
    .build();

  const simulation = await getRpc().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(
      `simulation error: ${
        (simulation as { error?: string }).error ?? "unknown"
      }`,
    );
  }

  if ("result" in simulation && simulation.result) {
    return bigintsToStrings(scValToNative(simulation.result.retval)) as T;
  }

  return undefined as T;
}
