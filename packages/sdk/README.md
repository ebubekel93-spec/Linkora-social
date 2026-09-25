# linkora-sdk

Typed TypeScript client for `LinkoraContract` on Stellar.

## Common Operations

A quick-reference cheatsheet for common SDK tasks. All snippets use TypeScript with standard `linkora-sdk` imports.

### 1. Initialize Client

```ts
import { LinkoraClient } from "linkora-sdk";

const client = new LinkoraClient({
  contractId: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});
```

### 2. Connect Wallet (Freighter)

```ts
import { FreighterSigner } from "linkora-sdk";

const signer = new FreighterSigner({ network: "testnet" });
const address = await signer.getPublicKey();
```

### 3. Create a Post

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareCreatePostTx(address, "Hello Stellar!");
const hash = await submitTransaction(client, txXdr, signer);
```

### 4. Follow a User

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareFollowTx(address, targetAddress);
const hash = await submitTransaction(client, txXdr, signer);
```

### 5. Unfollow a User

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareUnfollowTx(address, targetAddress);
const hash = await submitTransaction(client, txXdr, signer);
```

### 6. Tip a Creator

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareTipTx(address, postId, tokenAddress, 10_000_000n);
const hash = await submitTransaction(client, txXdr, signer);
```

### 7. Like a Post

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareLikePostTx(address, postId);
const hash = await submitTransaction(client, txXdr, signer);
```

### 8. Get Feed / Posts

```ts
import { Post } from "linkora-sdk";

const totalPosts = await client.getPostCount();
const post: Post | null = await client.getPost(totalPosts > 0n ? totalPosts - 1n : 0n);
```

### 9. Get User Profile

```ts
import { Profile } from "linkora-sdk";

const profile: Profile | null = await client.getProfile(address);
console.log(profile?.username);
```

### 10. Deposit to Community Pool

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.preparePoolDepositTx(address, poolId, 50_000_000n);
const hash = await submitTransaction(client, txXdr, signer);
```

### 11. Register Encrypted DM Key

```ts
import { submitTransaction } from "linkora-sdk";

const txXdr = await client.prepareDmKeyTx(address, publicKeyBytes);
const hash = await submitTransaction(client, txXdr, signer);
```

### 12. Subscribe to Contract Events

```ts
import { LinkoraEventSubscriber } from "linkora-sdk";

const sub = new LinkoraEventSubscriber({ rpcUrl, contractId });
sub.on("event", (evt) => console.log("Event received:", evt));
await sub.start();
```

### 13. Monitor Connection Health

```ts
import { ConnectionHealthMonitor } from "linkora-sdk";

const monitor = new ConnectionHealthMonitor(rpcUrl);
const isHealthy = await monitor.check();
```

## Transaction retries: exponential backoff with jitter

`TransactionQueue` submits transactions through the Soroban RPC with a retry
policy designed to survive network congestion without making it worse. Instead
of fixed-interval retries — which cause every client to hit the network in
lockstep (a "thundering herd") — failed submissions are retried with
**exponential backoff and jitter**, bounded by a **circuit breaker**.

### Behavior

- **Exponential backoff** — the delay between retries grows as
  `baseDelayMs * 2^attempt`, capped at `maxDelayMs`.
- **Jitter** — a random `0 … jitterFactor * delay` is added to each delay so
  concurrent retriers spread out instead of retrying in sync.
- **Retry-After** — `429` (rate-limited) responses that carry a `Retry-After`
  header (delta-seconds or HTTP-date) are honored; that delay takes precedence
  over the computed backoff (still bounded by `maxDelayMs`).
- **Circuit breaker** — after `circuitBreakerThreshold` consecutive retryable
  failures the breaker opens, the queue is paused, and a `CircuitBreakerError`
  is thrown so callers can report the endpoint as unhealthy.
- **Permanent failures are not retried** — a submission the RPC rejects outright
  (`ERROR` status) fails fast rather than consuming retry budget.
- **Structured logging** — every retry decision is reported to an optional
  `logger` with the attempt number, delay, and reason
  (`error` | `rate-limited` | `circuit-open` | `exhausted`).

### Configuration

Retry tunables default to the environment, and can be overridden per queue.

| Environment variable                 | Default | Meaning                                        |
| ------------------------------------ | ------- | ---------------------------------------------- |
| `TX_RETRY_MAX_ATTEMPTS`              | `5`     | Max attempts (including the first) per submit  |
| `TX_RETRY_BASE_DELAY_MS`             | `1000`  | Base delay for the exponential term            |
| `TX_RETRY_MAX_DELAY_MS`              | `30000` | Upper bound on a single delay                  |
| `TX_RETRY_JITTER_FACTOR`             | `0.5`   | Jitter window as a fraction of the delay (0–1) |
| `TX_RETRY_CIRCUIT_BREAKER_THRESHOLD` | `5`     | Consecutive failures before the breaker opens  |

### Usage

```ts
import { TransactionQueue, ConnectionHealthMonitor } from "linkora-sdk";

const health = new ConnectionHealthMonitor(rpcUrl);

const queue = new TransactionQueue({
  signer,
  rpc,
  // Per-queue overrides (any omitted field falls back to the env defaults):
  retry: { maxAttempts: 5, baseDelayMs: 1000, maxDelayMs: 30000, jitterFactor: 0.5 },
  // Surface retry telemetry + circuit-breaker health through the monitor:
  logger: (info) => health.recordRetry(info),
});

queue.enqueue(xdr1).enqueue(xdr2);

try {
  await queue.run();
} catch (err) {
  if (queue.isCircuitOpen) {
    // Endpoint is unhealthy — back off before submitting more work.
  }
  throw err;
}
```

The lower-level primitives (`backoffWithJitter`, `CircuitBreaker`,
`parseRetryAfter`, `withRetry`) are exported directly for reuse.

### Dry-run status events

`TransactionQueue` emits status events via `queue.on("status", ...)`. When run
in **dry-run** mode (`run({ dryRun: true })` or a queue-level `dryRun: true`),
each step is simulated but never submitted. The queue still emits a `confirmed`
event at the end of each step to mark it complete, but that event:

- carries `dryRun: true`, and
- has **no** `hash` (nothing was broadcast).

Consumers listening for on-chain confirmations should check the `dryRun` flag to
avoid mistaking a simulated flow for a real submission:

```ts
queue.on("status", (e) => {
  if (e.status === "confirmed") {
    if (e.dryRun) {
      // Simulated — do not show as "submitted to network".
    } else {
      // Real confirmation — e.hash is present.
    }
  }
});
```

## API Semantics

The SDK exposes two distinct paths for mutative (write) operations:

### 1. `prepare*Tx` (Submittable)

Methods like `prepareCreatePostTx`, `prepareFollowTx`, and `prepareDmKeyTx` are the **intended path for client-side applications**.
They fetch the actual account sequence from Horizon, simulate the transaction to discover footprint/fees, and return a base64-encoded `TransactionEnvelope` XDR that is fully ready to be signed (e.g. by Freighter) and submitted to the network.

```ts
const txXdr = await client.prepareCreatePostTx("GBFOY...", "Hello!");
// txXdr is ready to be passed to wallet for signing
```

### 2. Base Write Methods (Throwaway XDR)

Methods like `createPost`, `follow`, and `tip` **do not fetch sequence numbers** and return XDR built using a throwaway `Keypair`.
**These are not directly submittable.** They exist primarily to easily extract the Soroban `Operation` for batching (e.g., passing to `buildMultiOpTx`) or for server-side queueing where sequence management is handled by a background worker (like `TransactionQueue`).

If you attempt to sign and submit this XDR directly, the network will reject it with a `tx_bad_seq` error.
