# KaliwLauncher 0.5

Aplicativo portátil para Windows x64 com interface Kaliw e emulação integrada de PlayStation e PlayStation 2. Não é necessário instalar PCSX2, DuckStation ou RetroArch separadamente.

## Testar

Abra `dist/KaliwLauncher 0.5.0.exe`. No menu **BIOS**, importe suas BIOS descompactadas: PS1 em `.bin` de 512 KB, PS2 em `.bin` de 4 MB. Na aba BIOS, também é possível escolher o download do OpenBIOS livre para PS1; ele possui abertura própria e compatibilidade variável. Os arquivos são copiados para os dados do Kaliw. A validação inicial verifica tamanho e assinaturas; a identificação final de uma BIOS compatível é feita pelo núcleo. Use BIOS da região dos jogos para o boot completo.

Escolha o console, adicione seus jogos e selecione **Jogar agora**. Para PS1 com faixas BIN, importe o CUE correspondente. Os jogos permanecem na pasta original. O botão **Boot do console** inicia sem disco. **Exibir boot original antes dos jogos** controla o boot completo.

A emulação abre em uma janela de jogo em tela cheia pelo runtime incluído. Ao fechar o jogo, o Kaliw volta ao menu. O programa usa código aberto de terceiros; os motores não foram escritos do zero para o Kaliw. Não são incluídos BIOS ou jogos.

## Controles, saves e temas

Controle XInput ou teclado: setas para direcional, Z/X/A/S para botões de face, Enter para Start, Shift direito para Select, Q/W para L1/R1 e E/R para L2/R2. Durante o jogo: Esc encerra e retorna ao Kaliw, F1 abre opções, F2 salva estado e F4 carrega o estado. Salve também pelo próprio jogo.

A pasta **Ajustes → Saves e dados** contém `system/` (BIOS e dados internos do PS2), `saves/`, `states/`, `sessions/` e `logs/`. Tudo fica em `app.getPath('userData')/emulation`, fora da extração temporária do executável portátil. Faça backup dessa pasta. BIOS selecionadas em emuladores externos na versão antiga precisam ser importadas; a biblioteca existente é preservada.

Os quatro temas, dois estilos de carrossel e níveis de animação continuam disponíveis em Ajustes. Há uma única capa por console integrado. As capas são composições gráficas e as preferências visuais ficam salvas neste computador.

## Motores e fontes

Runtime: RetroArch 1.22.2. PS1: SwanStation 1.0.0, commit `631f0fb31b809e0f889d7c551fe695788e39c1d3`. PS2: PCEE2 v2.9.138 (derivado de PCSX2), commit `f52b5a6fe43278dcfc827b85b09fced5a82f863f`. Bibliotecas de suporte C++ Microsoft incluídas localmente. Créditos e textos de licença em **Ajustes → Créditos**. As DLLs dos núcleos e o runtime não foram modificados; o metadado `supports_no_game` foi alinhado à declaração efetiva dos núcleos.

`dist/KaliwLauncher-0.5.0-sources.zip` contém o código Kaliw e arquivos-fonte das revisões dos projetos utilizados. Veja os READMEs e submódulos upstream para compilar esses projetos. O manifesto em `engines/manifest.json` registra URLs e SHA-256 dos pacotes utilizados. A preparação falha se os pacotes upstream mudarem de hash, exigindo revisão explícita de uma nova revisão.

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

## Abas BIOS e Jogos (0.4)

**BIOS:** mostra o estado de PS1 e PS2, permite importar arquivos locais, procurar BIOS numa pasta escolhida (até cinco níveis, 5.000 entradas e 100 resultados) e escolher o download do OpenBIOS. A busca só lista resultados; nada é importado sem escolha. Para PS2, há acesso à orientação oficial de extração; o catálogo não oferece BIOS Sony de terceiros.

**Jogos:** Descobrir jogos lista apenas homebrew distribuído pelos autores para plataformas integradas. Catálogo inicial: Tetrade (PS1, MIT) e NIM (PS2, GPL-3.0). Minha biblioteca oculta plataformas sem motor integrado. Há filtros por plataforma e busca por nome. Para importar jogos próprios, selecione PS1 ou PS2 no filtro.

Ao abrir uma aba, o Kaliw verifica a disponibilidade das fontes conhecidas, sem baixar conteúdo. Escolher download abre a ficha com versão, autor, licença, tamanho e origem. Apenas Baixar e instalar inicia a transferência. Há progresso e cancelamento; tamanho e SHA-256 são conferidos antes da instalação. Itens nunca são iniciados automaticamente. Os arquivos, as licenças e os links de fonte ficam em `emulation/downloads/`. Nenhuma URL arbitrária ou arquivo compactado é executado. O CUE do Tetrade é preparado automaticamente junto ao BIN. As versões do catálogo são fixadas e verificadas; a busca consulta esse catálogo inicial, não um índice irrestrito de ROMs comerciais na internet.

Testes da 0.4: download e instalação dos três itens nas fontes reais, bloqueio de hash incorreto, cancelamento, busca local, confirmação de download e filtros de plataformas. Com OpenBIOS e a imagem de disco do Tetrade, foi conferida visualmente a tela inicial do jogo após 1.500 quadros. Áudio, comandos durante a partida, PS2 com BIOS real e compatibilidade de outros títulos não foram validados.

## Alterações 0.5

A aba BIOS concentra as importações e a seleção por console, salva para o próximo boot/jogo. Automática escolhe a região no PS1; no PS2 utiliza a primeira BIOS disponível. As BIOS novas mantêm o nome original no seletor; importações antigas aparecem pelo nome gerenciado. Downloads atualizam somente progresso e texto, preservando os cartões.

Ajustes → Configurar jogadores oferece quatro perfis com teclado, controle XInput ou ambos, escolha do slot físico, remapeamento de botões/analógicos e zona morta. Clique no mapeamento e pressione a entrada; Esc cancela, Backspace limpa tecla e clique direito limpa botão/eixo. PS1 oferece digital ou DualShock. Multitap pode ser automático ou nas portas 1/2; depende do jogo. O motor PS2 agora é PCEE2 v2.9.138, com suporte real a multitap. O sistema usa as mesmas pastas de BIOS e memory cards PS2; estados rápidos de outro motor não são intercambiáveis.

Validados geração de configurações dos quatro jogadores, isolamento de entradas, multitap, seletor de BIOS, persistência, captura de teclado, progresso sem recriar cartões e carregamento nativo dos motores. Nenhum controle físico estava conectado no ambiente de teste; quatro controles simultâneos e gameplay PS2 com BIOS Sony ainda precisam de teste no hardware do usuário. Koffi 3.3.4 (MIT) consulta os quatro slots XInput do Windows.
