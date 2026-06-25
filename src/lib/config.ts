const fallbackNetwork = "testnet";
const fallbackRpcUrl = "https://soroban-testnet.stellar.org";
const fallbackHorizonUrl = "https://horizon-testnet.stellar.org";
const fallbackContractId =
  "CCNR43J7GIYASMXZALQAWJHI66WPLG7BFRGCGDJR44DACNFVQGT2MTIZ";
const fallbackPassphrase = "Test SDF Network ; September 2015";

export const config = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? fallbackNetwork,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? fallbackRpcUrl,
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID ?? fallbackContractId,
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL ?? fallbackHorizonUrl,
  networkPassphrase:
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? fallbackPassphrase,
};
