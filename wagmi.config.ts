import { defineConfig } from '@wagmi/cli'
import { hardhat } from '@wagmi/cli/plugins'
// import { viem } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'packages/frontend/src/abis/generated.ts', // path to output your generated code
  plugins: [
    hardhat({
      project: './packages/contracts', // path to your hardhat project
    }),
    // viem(),
  ],
})