# Aditya Danapurkar — site content (reference)

> Re-extracted 2026-10-19 after the copy rewrite. Verbatim.
> This is a **reference document, not a build input.** Both pages are authored as
> markup.
> Anything the pages do not say is listed under *Expansion gaps* and has **not** been
> invented.
>
> **Two pages carry this content.**
> - `index.html` — the **production** document. It is what the domain serves.
> - `test.html` — identical staging / local draft.

---

## Identity

| Field | Value |
| --- | --- |
| Name | Aditya Danapurkar |
| Title (document) | Aditya Danapurkar · Full-Stack Blockchain & AI Engineer |
| Role (canonical) | Full-Stack Blockchain & AI Systems Engineer |
| Canonical URL | https://adityadanapurkar.com/ |
| Email | dan.aditya.0@gmail.com |
| Availability | Available for opportunities |
| Location | India · IST (UTC+05:30) · Global Async Overlap |
| GitHub | @ad-dan |
| Domain | adityadanapurkar.com |

**Meta description (as shipped, on both pages):**
> Full-stack blockchain and systems engineer architecting end-to-end decentralized protocols: formal EVM/Solana contract invariants, high-throughput node infrastructure, and autonomous LLM agents executing deterministic on-chain workflows.

The same description is repeated on `og:description` and `twitter:description`; the same
title on `og:title` and `twitter:title`. `site.webmanifest` carries the same description
under the name "Aditya Danapurkar — Blockchain & AI Engineer". The OG share card
(`og-image.jpg`, rendered by `scripts/make-og-image.py`) sets the same role line.

---

## Hero

**Status:** Operational // Available for new engagements (interactive toggle)

**Role line:** Full-Stack Blockchain & AI Systems Engineer · SYS: PRODUCTION // IST (UTC+05:30)

**Lede:**
> I build distributed infrastructure, smart contracts that don't bleed liquidity, and AI systems that verify their own math before touching a mempool. 4+ years shipping production Web3. Less hype, more uptime.

**Primary actions:** "Explore Deployments ↗" · "Initiate Technical Inquiry ↗" · "Systems Architecture & Stack ↓"

**Section Navigation Index:**
1. Profile [01]
2. Metrics [02]
3. Selected Work [03]
4. Activity [04]
5. Contact [05]

---

## 01 / Profile / Architecture

**Aside:** Core systems paradigm, execution stack, and cross-layer integration.

**Bio, paragraph 1:**
> I am a **full-stack blockchain and systems engineer** operating at the intersection of protocol design, systems programming, and applied AI. My work spans the complete decentralized state lifecycle: authoring formally verifiable, gas-optimized Solidity smart contracts, building resilient Node.js and Go microservices that index mempool activity and stream ledger states, and hardening production container topologies against RPC partition and network latency.

**Bio, paragraph 2:**
> Smart contracts enforce immutable settlement; my **autonomous AI systems** operationalize that state. Rather than relying on fragile prompt heuristics, I architect deterministic agent pipelines that ground LLM reasoning directly in live EVM state tries and Solana account memory. These agents perform pre-flight transaction simulations against local forks, synthesize dynamic ABI encodings, enforce mathematical slippage and gas invariants, and dispatch atomic cross-chain operations under strict cryptographic constraints.

**Stack chips:** TypeScript · Solidity · Python · Go · Node.js · React · Next.js · EVM Bytecode · Solana SVM · LangChain · Hardhat · Viem / Ethers · Docker · AWS · Git / CI·CD

**Fact table:**

| Key | Value |
| --- | --- |
| role | Full-Stack Blockchain & AI Systems Engineer |
| base | India · IST (UTC+05:30) · Global Async Overlap |
| focus | Autonomous Agent Runtimes · Protocol Design · EVM/Solana Infrastructure |
| core stack | Solidity · TypeScript · Node.js · Python · Go |
| chains | Ethereum · Solana · Layer-2 / EVM Compatible Networks |
| availability | Available for opportunities |

---

## Metrics

**Aside:** Quantifiable engineering throughput and infrastructure reliability.

| Value | Metric Key |
| --- | --- |
| 04+ | Years Architecting Web3 & Autonomous Systems |
| 2,000+ | Public & Enterprise Version Control Commits |
| 20+ | Smart Contracts Architected & Deployed |
| 99.9% | Execution Node & Ingestion Service Availability |

---

## Work

**Aside:** Production-grade distributed systems, decentralized protocols, and agent runtimes.

| # | Name | Category | Description | Tags | URL |
| --- | --- | --- | --- | --- | --- |
| 01 | ChainMind | Autonomous Agent Runtime | Cross-chain autonomous agent framework executing deterministic multi-network operations. ChainMind ingests natural-language intent, queries real-time Solana account data and EVM storage tries to ground prompt context, runs pre-flight transaction simulations against local forks, and dispatches atomic execution payloads across heterogeneous consensus environments. | TypeScript, LangChain, Solana RPC, EVM Web3 | https://adityadanapurkar.com/chainmindweb |
| 02 | Geth Wraith | Execution Node Telemetry | Real-time operational observability console for Go-Ethereum (Geth) execution clients. Bypasses intermittent polling by multiplexing duplex WebSocket streams directly against the JSON-RPC IPC interface—monitoring P2P peer discovery meshes, header and block synchronization stages, state trie cache memory pressure, and pending txpool propagation in sub-second intervals. | Node.js, WebSockets, Go-Ethereum, React | https://adityadanapurkar.com/gethwraithweb |
| 03 | Bao Dao | Decentralized Governance | Gasless on-chain governance architecture utilizing EIP-2771 meta-transactions and trusted forwarder contracts. Members sign ballot authorizations off-chain using structured EIP-712 typed digests; relayer worker pools ingest the signature payloads, verify sequential nonce integrity, and submit transactions on-chain—eliminating gas friction while mathematically guaranteeing cryptographic authenticity. | Solidity, EIP-2771, EIP-712, Next.js | https://adityadanapurkar.com/baodaowebsite |
| 04 | Vex Dex | Decentralized Finance | Non-custodial peer-to-peer liquidity settlement protocol enforcing deterministic state-machine invariants. Counterparties generate and sign off-chain cryptographic trade orders; the settlement smart contract atomically validates mutual signatures, verifies slippage bounds and expiration timestamps, and executes atomic token swaps within a single transaction frame without intermediary custody. | Solidity, Cryptographic Settlement, ERC-20, React | https://adityadanapurkar.com/vexdexwebsite |
| 05 | NFT Marketplace | Asset Protocol & Exchange | Decentralized digital asset exchange and auction protocol engineered directly against raw ERC-721 ABI specifications. Features escrowed English and Dutch auction state machines, decentralized metadata resolution through content-addressed IPFS gateways, and gas-optimized settlement routines hardened with reentrancy guards and modular royalty splits. | Solidity, ERC-721, IPFS, Ethers.js | https://adityadanapurkar.com/nftmarketwebsite |
| 06 | ERC Minter | Smart Contract Access Control | Token-gated generation protocol enforcing protocol-level access control directly at the bytecode boundary. Instead of relying on client-side gatekeeping, the contract executes EVM static calls to inspect callers' ERC-20 balances against snapshot thresholds directly within the mint routine before authorizing ERC-721 token issuance and state trie mutation. | Solidity, ERC-20, ERC-721, Hardhat | https://adityadanapurkar.com/minterwebsite |

---

## Activity

- **Handle:** @ad-dan — https://github.com/ad-dan
- **Window:** trailing twelve months, baked from `data/contributions.js`, no runtime API call

---

## Contact

**Aside:** Available for opportunities. I'd love to hear from you.

**Lead:**
> I don't do buzzword-heavy pitch decks or speculative advisory calls. If you are building non-trivial decentralized infrastructure, gas-optimized contracts that need formal invariant defenses, or autonomous agent execution pipelines grounded in real ledger state, let's talk engineering.

**Address:** dan.aditya.0@gmail.com
**Actions:** "Copy address" (button, resets after 2s) · the address is also a `mailto:` link

| Key | Value |
| --- | --- |
| response | Typically within 24 hours · IST (UTC+05:30) |
| open to | Available for opportunities |

**Coordinates:**

| Label | Handle | URL |
| --- | --- | --- |
| GitHub | @ad-dan | https://github.com/ad-dan |
| LinkedIn | in/adityadanapurkar | https://www.linkedin.com/in/aditya-danapurkar-596102149/ |
| Telegram | @danaditya0 | https://t.me/danaditya0 |
| Portfolio | adityadanapurkar.com | https://adityadanapurkar.com |

---

## Footer

Name, then a two-column ledger: **Local time** (live IST clock) and **Contact** (mailto address).

---

## Command Console

⌘K opens a combobox. Its placeholder is "Navigate sections, inspect deployments, copy contact details...".
Commands are generated at runtime: one per `data-panel` section (labelled from `data-label`), one per outbound link (grouped by the panel it sits in), and one "Copy email address" action.