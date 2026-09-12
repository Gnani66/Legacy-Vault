# Legacy Vault - Web3 Digital Inheritance Platform

Decentralized vault for securing digital assets with nominee-based inheritance, IPFS storage, blockchain smart contracts, and AI-powered verification.

## Repository Structure

`
legacy-vault-web3/
+-- backend/            # Express + TypeScript API (Pinata IPFS, Supabase, Ethers)
¦   +-- src/
¦   ¦   +-- server.ts          # Entry point - Express app
¦   ¦   +-- routes/            # /api/upload, /api/blockchain, /ai, /test
¦   ¦   +-- services/          # pinataService, blockchainService, aiService
¦   ¦   +-- middleware/upload.ts
¦   ¦   +-- config/supabase.ts
¦   +-- package.json
¦   +-- .env.example           # Copy to .env and fill secrets
+-- ai-service/         # FastAPI Python service - Death certificate verification
¦   +-- main.py                # POST /verify-death-certificate
¦   +-- ocr.py, qr_verification.py, mock_registry.py, scoring.py
¦   +-- .env.example
+-- contracts/          # Solidity - LegacyVault.sol (Hardhat 3)
+-- ignition/           # Hardhat Ignition deployment modules
+-- test/               # Hardhat tests (Solidity + Mocha/ethers)
+-- hardhat.config.ts
+-- frontend/           # <-- FOR FRONTEND DESIGNER - create this folder!

`

## Smart Contract - \contracts/LegacyVault.sol\

- \egisterVault()\, \createAsset(name, ipfsCid)\, \ssignNominee(assetId, nominee)\, \cceptNomination(assetId)\, \submitClaim(assetId)\, \unlockAsset(assetId)\
- Views: \getAsset(assetId)\, \getOwnerAssets(owner)\, \getNomineeAssets(nominee)\
- Events: \AssetCreated\, \NomineeAssigned\, \NomineeAccepted\, \ClaimSubmitted\, \AssetUnlocked\

Network: Hardhat 3 with \hardhat-toolbox-mocha-ethers\, Sepolia config via \SEPOLIA_RPC_URL\ + \SEPOLIA_PRIVATE_KEY\.

## Backend API - \ackend\ (Port 5000)

Base: \http://localhost:5000\

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \/\ | Health check |
| GET | \/api/health\ | API healthy |
| POST | \/api/upload\ | Upload file -> Pinata IPFS -> returns \{ success, cid }\ (multipart \ile\) |
| POST | \/api/blockchain/unlock/:assetId\ | Unlock asset on-chain -> \{ success, transactionHash }\ |
| POST | \/api/ai/verify-death-certificate\ | Proxy to ai-service -> verification result |
| GET | \/api/test\ | Test routes |

**CORS enabled for frontend.**

## AI Service - \i-service\ (Port 8000)

\\\ash
cd ai-service
pip install -r requirements.txt
cp .env.example .env  # fill OPENROUTER_API_KEY
python main.py  # or: uvicorn main:app --reload --port 8000
\\\

- \POST /verify-death-certificate\ (multipart \ile\: PDF/JPG/PNG/WEBP) -> OCR + QR + mock registry + scoring
- \GET /health\, \GET /\

## Quick Start (Backend + Contracts)

\\\ash
# 1. Clone
git clone https://github.com/Gnani66/Legacy-Vault.git
cd Legacy-Vault

# 2. Backend
cd backend
cp .env.example .env   # fill all values
npm install
npm run dev            # http://localhost:5000

# 3. AI Service (in another terminal)
cd ../ai-service
pip install -r requirements.txt
cp .env.example .env
python main.py         # http://localhost:8000

# 4. Contracts
cd ..
npm install
npx hardhat test
npx hardhat ignition deploy ignition/modules/Counter.ts  # local
\\\

## Environment Variables

See \ackend/.env.example\ and \i-service/.env.example\. Never commit \.env\.

## For Frontend Designer

1. **Clone this repo:**
   \\\ash
   git clone https://github.com/Gnani66/Legacy-Vault.git
   cd Legacy-Vault
   \\\

2. **Create frontend folder in repo root:**
   \\\ash
   npx create-next-app@latest frontend --typescript --tailwind --eslint
   # or: npx create-vite@latest frontend --template react-ts
   \\\

   Recommended stack: **Next.js + Tailwind + ethers.js v6 + wagmi** or **React + Vite**.

3. **Key UX flows to build:**
   - Connect Wallet (MetaMask, ethers.js)
   - Register Vault -> \egisterVault()\
   - Create Asset (upload file -> \POST /api/upload\ -> get CID -> \createAsset(name, cid)\)
   - Assign Nominee (address input)
   - Nominee Acceptance (\cceptNomination\)
   - Claim flow: Nominee uploads death certificate -> \POST /api/ai/verify-death-certificate\ -> if verified -> \submitClaim\ -> \unlockAsset\
   - Dashboard: view owner/nominee assets via \getOwnerAssets\/\getNomineeAssets\ + \getAsset(id)\

4. **API integration example:**
   \\\	s
   // Upload to IPFS
   const form = new FormData(); form.append("file", file);
   const { cid } = await fetch("http://localhost:5000/api/upload", { method:"POST", body: form }).then(r=>r.json());

   // Blockchain (ethers v6 + contract ABI)
   const vault = new ethers.Contract(contractAddress, abi, signer);
   await vault.createAsset("My Will", cid);
   \\\

5. **Push your frontend:**
   \\\ash
   git add frontend/
   git commit -m "feat: add frontend"
   git push origin main
   \\\

   Or create a branch: \git checkout -b frontend && git push -u origin frontend\

6. **Do NOT commit:** \
ode_modules/\, \dist/\, \.env\ (use \.env.local\ for Next.js).

CORS is already enabled on backend. Use \http://localhost:5000\ and \http://localhost:8000\ during dev.

## Deployment Notes

- Backend: \
pm run build && npm start\ (needs Node 18+, env vars)
- AI Service: Docker or \uvicorn main:app --host 0.0.0.0 --port 8000\
- Contract: Deploy to Sepolia via \
px hardhat ignition deploy --network sepolia ignition/modules/Counter.ts\

## License

ISC
