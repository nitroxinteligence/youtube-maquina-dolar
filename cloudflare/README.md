# Armazenamento de cadastros na Cloudflare

O formulário da Vercel grava os dados através do Worker `youtube-maquina-dolar-leads`, que usa o banco D1 `youtube-maquina-dolar-leads`. A Vercel continua responsável pelo site e pelo endpoint `/api/leads`; o Worker não envia e-mails nem mensagens.

## Deploy

Na raiz do projeto, com o Wrangler autenticado:

```bash
npx wrangler d1 migrations apply youtube-maquina-dolar-leads --config cloudflare/wrangler.jsonc --remote
npx wrangler deploy --config cloudflare/wrangler.jsonc
```

Depois do deploy, configure `CLOUDFLARE_LEADS_API_URL` na Vercel com a URL `workers.dev` do Worker, sem `/leads` no final. O endpoint da Vercel continua aceitando apenas o formato do formulário e repassa o cadastro ao D1.
