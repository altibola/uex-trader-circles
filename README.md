# UEX Trader Circles (v0.1)

Uma extensão de navegador modular escrita em TypeScript, voltada para o ecossistema UEX Corp (`uexcorp.space`) e Star Citizen (Roberts Space Industries). Ela facilita a identificação visual de traders, organizações e comunidades (Circles) em comum.

---

## 🌌 Funcionalidades Principais

1. **Reconhecimento Visual de Traders (Galaxy Spiral)**:
   - Destaque translúcido e gradiente estelar nos handles dos traders no marketplace (`/marketplace/?type=item`), páginas de anúncio (`/marketplace/item/info/*`) e perfis de usuário (`/@<nick>`).
   - Ícone de espiral galáctica com rotação suave e efeito glow.
2. **Identificação de Circles em Comum**:
   - Hover interativo exibindo organizações RSI e círculos em comum entre você e o vendedor/comprador.
3. **Circle Local Opt-In ("UEX Trader Circles")**:
   - Círculo de comunidade com opt-in imediato e 100% local no popup da extensão.
4. **Scraping Otimizado da RSI com Cache de 24 Horas**:
   - Consulta direta à página pública da RSI (`https://robertsspaceindustries.com/en/citizens/<nick>/organizations`).
   - Extrai automaticamente o nome da organização, SID (Spectrum Identification), emblema e rank.
   - Ignora entradas com status `Redacted` ou visibilidade oculta.
   - Sistema de cache local persistente com TTL de 24 horas, limitando consultas e garantindo alta performance.
5. **Permissões Restritas e Transparentes**:
   - Permissões estritamente limitadas aos sub-caminhos necessários (`uexcorp.space/*`, `robertsspaceindustries.com/en/citizens/*/organizations` e `robertsspaceindustries.com/en/account/organization`).
   - Painel explicativo transparente no popup da extensão detalhando a finalidade de cada permissão.
6. **Multi-Browser (Chrome, Firefox, Safari)**:
   - Compilação independente para Google Chrome (Manifest V3), Mozilla Firefox (Manifest V3/Gecko) e Safari (Web Extension com bundle e script conversor `xcrun safari-web-extension-converter`, sem necessidade de código Swift manual).

---

## 📦 Como Instalar e Usar as Extensões em ZIP

Baixe os pacotes `.zip` da release (ex: `uex-trader-circles-v0.1-<navegador>.zip`) ou gere-os localmente via `pnpm package`.

### 1. Google Chrome / Brave / Edge / Opera
1. Extraia o arquivo `uex-trader-circles-v0.1-chrome.zip` em uma pasta de sua preferência.
2. Abra o Chrome e navegue até `chrome://extensions/`.
3. No canto superior direito, ative a opção **Modo do desenvolvedor** (*Developer mode*).
4. Clique no botão **Carregar sem compactação** (*Load unpacked*).
5. Selecione a pasta onde você descompactou o arquivo (a pasta contendo o `manifest.json`).
6. A extensão estará ativa! Fixe-a na barra de ferramentas e acesse o [Marketplace UEX](https://uexcorp.space/marketplace/?type=item).

### 2. Mozilla Firefox
1. Abra o Firefox e digite `about:debugging#/runtime/this-firefox` na barra de endereços.
2. Na seção **Extensões temporárias** (*Temporary Extensions*), clique em **Carregar extensão temporária...** (*Load Temporary Add-on...*).
3. Selecione o próprio arquivo ZIP `uex-trader-circles-v0.1-firefox.zip` (ou o arquivo `manifest.json` dentro da pasta descompactada).
4. A extensão será carregada imediatamente no Firefox para uso e testes.

### 3. Apple Safari (macOS)
1. Extraia o arquivo `uex-trader-circles-v0.1-safari.zip`.
2. No Safari, abra **Preferências / Ajustes** (`Cmd + ,`) -> aba **Avançado** e marque **Mostrar recursos para desenvolvedores da Web**.
3. No menu **Desenvolvedor** que surgiu na barra de menus, marque **Permitir extensões não assinadas** (*Allow Unsigned Extensions*).
4. Para gerar o container de aplicativo do Safari sem tocar em código Swift, execute o script embutido no terminal do Mac:
   ```bash
   bash convert-safari.sh
   ```
   Isso executará o comando nativo `xcrun safari-web-extension-converter` gerando o app container pronto para execução no Safari.

---

## 📂 Arquitetura do Monorepo

O projeto está estruturado em monorepo com `pnpm`:

```
.
├── packages/
│   └── core/                     # Regras de negócio, scrapers RSI/UEX, cache TTL e matcher de circles
│       ├── src/
│       │   ├── types.ts          # Interfaces e tipos de dados
│       │   ├── scrapers/         # Scrapers otimizados para RSI e UEX
│       │   ├── cache.ts          # Gerenciador de cache com TTL 24h e adaptadores de armazenamento
│       │   ├── circles.ts        # Algoritmos de cruzamento de circles
│       │   └── service.ts        # Serviço centralizado de circles
│       └── tests/                # Testes unitários com Vitest
│
├── apps/
│   └── extension/                # Código da extensão para os navegadores
│       ├── public/               # Ícones SVG e PNGs em múltiplas resoluções
│       ├── src/
│       │   ├── background/       # Service worker e listeners de mensagens
│       │   ├── content/          # Content script, injetor de estilos e popover hover interativo
│       │   └── popup/            # Interface de configuração e transparência de permissões
│       └── scripts/              # Geradores de manifest e empacotamento cross-browser
│
└── .github/
    └── workflows/                # CI/CD para build, testes e releases automáticos
        ├── ci.yml
        └── release.yml
```

---

## 🚀 Desenvolvimento e Build

### Instalação das Dependências

```bash
pnpm install
```

### Rodando a Suíte de Testes

```bash
pnpm test
```

### Compilando para Todos os Navegadores

```bash
pnpm build
```

As compilações serão geradas em:
- `apps/extension/dist/chrome`
- `apps/extension/dist/firefox`
- `apps/extension/dist/safari`

### Gerando os Pacotes ZIP da Release (v0.1)

```bash
pnpm package
```

Arquivos gerados em `apps/extension/dist`:
- `uex-trader-circles-v0.1-chrome.zip`
- `uex-trader-circles-v0.1-firefox.zip`
- `uex-trader-circles-v0.1-safari.zip`
- `convert-safari.sh`
