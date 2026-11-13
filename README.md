# PROMESSA

Jogo de futebol para navegador (PC e celular) com três modos: **Carreira**, **Jogador × Jogador** e **ULTIMATE PROMESSA** (colecionável de cartas com mercado entre jogadores).

**Jogue:** https://promessafc.vercel.app

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

## Modos
- **Carreira**: crie um atleta, evolua por árvore de habilidades, transfira-se entre clubes, dispute ligas e copas com calendário completo. Joga sem conta (save local); logado, o save sincroniza na nuvem.
- **Jogador × Jogador**: draft de elencos, escalação por arrastar (PC e toque), intervalo tático, série melhor de 3; partida online por código de sala via Supabase Realtime.
- **ULTIMATE PROMESSA**: pacotes por raridade com sorteio no servidor, coleção, álbum por liga/clube, missões diárias/semanais, desafios e mercado entre jogadores; aba online jogando só com as próprias cartas.

## Arquitetura
- Front-end em **JavaScript puro** (sem framework), páginas estáticas servidas pela Vercel.
- Backend **Supabase** (Auth, Postgres, Realtime). Login por e-mail ou Google (Google Identity Services + `signInWithIdToken`).
- Base de jogadores com ~18 mil atletas e fórmula única de overall compartilhada por todos os modos.

## Segurança (o que mais deu trabalho)
- Toda ação sensível passa por **funções `SECURITY DEFINER`** que usam `auth.uid()`; funções internas (sorteio, movimentação de moeda, emissão de carta) sem `EXECUTE` para `anon`/`authenticated`. RLS ligada em todas as tabelas.
- **Sorteio dos pacotes no servidor**: a chance exibida é a chance real; o cliente só anima o resultado.
- **Anti-farm / anti-fraude**: limites no mercado, conta mínima para ranking, partidas online só contam com placares confirmados pelos dois lados, uma partida por dupla por dia.
- **CSP `script-src 'self'`** sem CDN e sem handlers inline; SDK do Supabase servido localmente.
- Painel administrativo fora do deploy, exigindo conta com papel admin em `app_metadata` **e 2FA (AAL2)** verificados no banco.

## O que não está neste repositório
Para respeitar licenças e direitos de imagem, ficam fora: base de dados de jogadores, fotos, escudos e logos, migrações SQL, ferramentas internas e o modo online em desenvolvimento. O código aqui não roda sozinho sem esses dados.

## Autor
**Felipe Carvalho** · [GitHub](https://github.com/fcarvalho-dev)

