# KaliwLauncher 0.3

Aplicativo portátil para Windows x64 com interface Kaliw e emulação integrada de PlayStation e PlayStation 2. Não é necessário instalar PCSX2, DuckStation ou RetroArch separadamente.

## Testar

Abra `dist/KaliwLauncher 0.3.0.exe`. Em **Ajustes**, importe suas BIOS descompactadas: PS1 em `.bin` de 512 KB, PS2 em `.bin` de 4 MB. Os arquivos são copiados para os dados do Kaliw. A validação inicial verifica tamanho e assinaturas; a identificação final de uma BIOS compatível é feita pelo núcleo. Use BIOS da região dos jogos para o boot completo.

Escolha o console, adicione seus jogos e selecione **Jogar agora**. Para PS1 com faixas BIN, importe o CUE correspondente. Os jogos permanecem na pasta original. O botão **Boot do console** inicia sem disco. **Exibir boot original antes dos jogos** controla o boot completo.

A emulação abre em uma janela de jogo em tela cheia pelo runtime incluído. Ao fechar o jogo, o Kaliw volta ao menu. O programa usa código aberto de terceiros; os motores não foram escritos do zero para o Kaliw. Não são incluídos BIOS ou jogos.

## Controles, saves e temas

Controle XInput ou teclado: setas para direcional, Z/X/A/S para botões de face, Enter para Start, Shift direito para Select, Q/W para L1/R1 e E/R para L2/R2. Durante o jogo: Esc encerra e retorna ao Kaliw, F1 abre opções, F2 salva estado e F4 carrega o estado. Salve também pelo próprio jogo.

A pasta **Ajustes → Saves e dados** contém `system/` (BIOS e dados internos do PS2), `saves/`, `states/`, `sessions/` e `logs/`. Tudo fica em `app.getPath('userData')/emulation`, fora da extração temporária do executável portátil. Faça backup dessa pasta. BIOS selecionadas em emuladores externos na versão antiga precisam ser importadas; a biblioteca existente é preservada.

Os quatro temas, dois estilos de carrossel e níveis de animação continuam disponíveis em Ajustes. Há uma única capa por console integrado. As capas são composições gráficas e as preferências visuais ficam salvas neste computador.

## Motores e fontes

Runtime: RetroArch 1.22.2. PS1: SwanStation 1.0.0, commit `631f0fb31b809e0f889d7c551fe695788e39c1d3`. PS2: ParaLLEl PS2 (derivado de LRPS2/PCSX2), commit `38d3a83f4ecdec977d609ece8afcc527f5f68702`. Bibliotecas de suporte C++ Microsoft incluídas localmente. Créditos e textos de licença em **Ajustes → Créditos**. As DLLs dos núcleos e o runtime não foram modificados; o metadado `supports_no_game` foi alinhado à declaração efetiva dos núcleos.

`dist/KaliwLauncher-0.3.0-sources.zip` contém o código Kaliw e arquivos-fonte das revisões dos projetos utilizados. Veja os READMEs e submódulos upstream para compilar esses projetos. O manifesto em `engines/manifest.json` registra URLs e SHA-256 dos pacotes utilizados. A preparação falha se os pacotes upstream mudarem de hash, exigindo revisão explícita de uma nova revisão.

## Desenvolvimento

```powershell
npm install
npm run check
npm run test:engines
npm start
```

Os motores devem existir em `engines/`. Os scripts de preparação estão em `scripts/`; no ambiente Windows, os downloads podem precisar de `$env:NODE_USE_SYSTEM_CA='1'`. Para gerar o portátil: `npm run dist`. Quando o arquivo local oficial do Electron já existir, use `npm run dist -- --config.electronDist=.build-runtime/electron-v44.9.1-win32-x64.zip`.

## Validação desta versão

Verificadas sintaxe, interface, temas, restauração de preferências, importação/cópia estrutural de BIOS, caminhos de dados, opções de boot, carregamento nativo dos dois núcleos e tratamento de firmware ausente. Não foram fornecidos BIOS ou jogos reais, portanto gameplay, áudio em jogo, boots completos e compatibilidade de títulos ainda exigem validação com os arquivos do usuário. O desempenho depende do jogo, CPU e GPU. A abertura Kaliw é um vídeo original sem áudio de seis segundos, incluído no pacote.
