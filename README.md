# Dashboard de contas domésticas

Dashboard web para consolidar as contas da casa do Luís Paulo e da Camila, com divisão proporcional por receita.

## Dados iniciais

- Luís Paulo: R$ 10.000,00
- Camila: R$ 8.500,00
- Proporção atual: Luís Paulo 54,05% e Camila 45,95%
- Marcador Gmail: `Dashboard Contas`
- Pasta Google Drive: `1KNqdNGCW5sKdFqy5JG236rwXlk4M8vEQ`

## Como rodar

Para testar localmente, abra a pasta do projeto em um servidor local. Exemplo:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Depois acesse:

```text
http://127.0.0.1:4173
```

O projeto é HTML/CSS/JS estático. Ele não depende de um backend próprio e pode ser publicado em qualquer hospedagem estática.

### Recursos de interface

- **Tema claro/escuro**: alterne pelo botão de tema na barra superior; a escolha fica salva no navegador e respeita a preferência do sistema na primeira visita.
- **Instalável (PWA)**: em HTTPS (ex.: GitHub Pages) o app pode ser instalado na tela inicial do celular/desktop e abrir offline com os dados em cache. Os ícones ficam em `icons/` e podem ser regenerados com `node scripts/generate-icons.mjs`.
- **Mobile**: a barra superior mostra rótulos nos botões, há um botão flutuante de sincronização e gesto de puxar-para-atualizar.

As configurações iniciais ficam em `config.js`. Você também pode sobrescrever tudo pela janela Configurações do dashboard; nesse caso os valores ficam no navegador atual.

## Publicar no GitHub Pages

O projeto é 100% estático (HTML/CSS/JS com caminhos relativos), então pode ser publicado direto no GitHub Pages, sem build.

A publicação é automática via GitHub Actions (`.github/workflows/deploy-pages.yml`). Para ativar:

1. No GitHub, vá em **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Faça merge para o branch `main` (ou rode o workflow manualmente em **Actions → Deploy to GitHub Pages → Run workflow**).

A cada push em `main` o site é republicado. A URL pública fica no formato:

```text
https://luispmpa.github.io/Contas-V2/
```

> Importante: depois do primeiro deploy, autorize essa URL pública nas origens
> OAuth do Google Cloud e no domínio de autenticação do Firebase, senão o login
> Google e a sincronização Gmail/Drive serão bloqueados pelo navegador.

O arquivo `.nojekyll` garante que o GitHub Pages sirva todos os arquivos como estão, sem processamento Jekyll.

## Publicar na web (Firebase Hosting)

Alternativa ao GitHub Pages: Firebase Hosting, porque o mesmo projeto já usa Firestore e Firebase Auth.

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Google.
3. Ative Firestore.
4. Instale o Firebase CLI e faça login:

```powershell
npm install -g firebase-tools
firebase login
```

5. Vincule este diretório ao projeto:

```powershell
firebase use --add
```

6. Publique Hosting e regras:

```powershell
firebase deploy
```

Depois do deploy, autorize a URL pública do Hosting nas configurações OAuth do Google/Firebase.

## Integração com Google

O botão de sincronização usa login Google no navegador e lê:

- Gmail: mensagens do marcador `Dashboard Contas`
- Google Drive: arquivos dentro da pasta configurada e envio de anexos de contas manuais

Em produção, prefira Firebase Auth. No modo local sem Firebase, você pode informar um OAuth Client ID manualmente:

1. Crie um OAuth Client ID do tipo Web Application no Google Cloud.
2. Autorize a origem `http://127.0.0.1:4173`.
3. No dashboard, abra Configurações e cole o OAuth Client ID.
4. Clique em Conectar Google ou Sincronizar.

Escopos usados:

```text
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/drive
```

## Firebase opcional

O app funciona com cache local. Para acesso pela web e sincronização entre sessões/dispositivos, cole o JSON do Firebase em Configurações.

Cole um objeto nesse formato:

```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}
```

No deploy público, você pode preencher `firebaseConfig` diretamente em `config.js` com esse objeto.

Coleções usadas no Firestore:

```text
householdDashboards/{ID_DO_DASHBOARD}/records
householdDashboards/{ID_DO_DASHBOARD}/overrides
householdDashboards/{ID_DO_DASHBOARD}/standardAccounts
```

O ID padrão é `casa-luis-camila`.

As regras em `firestore.rules` liberam leitura e escrita para os e-mails do Luís Paulo e da Camila configurados na lista de proprietários.

## Como o parser trabalha

- Extrai valor por padrões em reais.
- Prioriza datas explicitamente rotuladas como `data de vencimento`, `vencimento`, `vence` ou `pagar até`.
- Aceita valores em reais com vírgula ou ponto decimal nas mensagens de origem.
- Marca como pago quando encontra sinais como `comprovante`, `pagamento confirmado`, `quitado` ou quando vincula um comprovante do Drive.
- Reconhece confirmações de pagamento do Nubank e da Somma para conciliar as respectivas contas.
- Vincula comprovantes do Drive por valor, mês, categoria e similaridade de texto.
- Permite ajustes manuais por registro, salvos no cache local e no Firestore quando configurado.

## Dashboard Nubank

O submenu `Nubank` é alimentado automaticamente durante a sincronização do Gmail:

- Localiza a mensagem de fechamento da fatura Nubank.
- Baixa e lê o PDF anexado ao e-mail.
- Extrai data, estabelecimento, valor e parcela de cada compra identificada.
- Exclui pagamentos de fatura, créditos, estornos, saldos reapresentados e linhas de resumo dos cálculos de compras.
- Separa automaticamente linhas do PDF que combinam uma compra com a coluna de pagamentos e mostra o ajuste na conciliação.
- Categoriza as compras e gera métricas, gráficos e insights.
- Permite abrir os quadrantes para detalhar as compras consideradas e ordenar a tabela por data, valor, estabelecimento ou categoria.
- Permite alternar o gráfico entre gastos dentro da fatura e evolução mensal, comparando o valor final com o valor efetivamente pago.
- Permite ordenar a tabela também clicando diretamente nos cabeçalhos das colunas.
- Salva as transações junto ao registro da fatura no cache local e no Firestore.

Não é necessário importar arquivos manualmente. Após a primeira atualização desta funcionalidade, execute `Sincronizar` para reprocessar as faturas já encontradas no período configurado.
