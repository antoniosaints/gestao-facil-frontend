import axios from 'axios'
// Even after HMR recreates this module, a request can never reach XHR/fetch.
// preview.ts installs fixture responses; unknown requests fail locally.
const http = axios.create({
  adapter: async () => {
    throw new Error('Prévia isolada: contrato de exemplo indisponível. Recarregue a página de QA.')
  },
})
export default http
