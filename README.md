# KaliwLauncher 0.8.0

Aplicativo portátil para Windows x64 com interface Kaliw e 11 plataformas com motores incluídos. Não é necessário instalar PCSX2, DuckStation ou RetroArch separadamente.

## Testar

Abra `dist/KaliwLauncher 0.8.0.exe`. No menu **BIOS**, importe suas BIOS descompactadas: PS1 em `.bin` de 512 KB, PS2 em `.bin` de 4 MB. Na aba BIOS, também é possível escolher o download do OpenBIOS livre para PS1; ele possui abertura própria e compatibilidade variável. Os arquivos são copiados para os dados do Kaliw. A validação inicial verifica tamanho e assinaturas; a identificação final de uma BIOS compatível é feita pelo núcleo. Use BIOS da região dos jogos para o boot completo.

Escolha o console, adicione seus jogos e selecione **Jogar agora**. Para PS1 com faixas BIN, importe o CUE correspondente. Os jogos permanecem na pasta original. O botão **Boot do console** inicia sem disco. **Exibir boot original antes dos jogos** controla o boot completo.

A emulação abre em uma janela de jogo em tela cheia pelo runtime incluído. Ao fechar o jogo, o Kaliw volta ao menu. O programa usa código aberto de terceiros; os motores não foram escritos do zero para o Kaliw. Não são incluídos BIOS ou jogos.

## Controles, saves e temas

Controle XInput ou teclado: setas para direcional, Z/X/A/S para botões de face, Enter para Start, Shift direito para Select, Q/W para L1/R1 e E/R para L2/R2. Durante o jogo, Start + Select no controle ou Ctrl direito + Enter no teclado abre o menu rápido: continuar, salvar/carregar estado no slot 1, reiniciar mantendo o disco ou fechar e voltar ao launcher. F2/F4 continuam disponíveis no runtime para estados legados. Salve também pelo próprio jogo.

A pasta **Ajustes → Saves e dados** contém `system/` (BIOS e dados internos do PS2), `saves/`, `states/`, `quick-states/`, `sessions/` e `logs/`. Tudo fica em `app.getPath('userData')/emulation`, fora da extração temporária do executável portátil. Faça backup dessa pasta. BIOS selecionadas em emuladores externos na versão antiga precisam ser importadas; a biblioteca existente é preservada.

Os quatro temas, dois estilos de carrossel e níveis de animação continuam disponíveis em Ajustes. Há uma única capa por console integrado. As capas são composições gráficas e as preferências visuais ficam salvas neste computador.

## Motores e fontes

Runtime: RetroArch 1.22.2. PS1: SwanStation 1.0.0, commit `631f0fb31b809e0f889d7c551fe695788e39c1d3`. PS2: PCEE2 v2.9.138 (derivado de PCSX2), commit `f52b5a6fe43278dcfc827b85b09fced5a82f863f`. Bibliotecas de suporte C++ Microsoft incluídas localmente. Créditos e textos de licença em **Ajustes → Créditos**. As DLLs dos núcleos e o runtime não foram modificados; o metadado `supports_no_game` foi alinhado à declaração efetiva dos núcleos.

`dist/KaliwLauncher-0.8.0-sources.zip` contém o código Kaliw e arquivos-fonte das revisões dos projetos utilizados. Veja os READMEs e submódulos upstream para compilar esses projetos. O manifesto em `engines/manifest.json` registra URLs e SHA-256 dos pacotes utilizados. A preparação falha se os pacotes upstream mudarem de hash, exigindo revisão explícita de uma nova revisão.

## Desenvolvimento

```powershell
npm install
npm run check
npm run test:engines
npm start
```

Os motores devem existir em `engines/`. Os scripts de preparação estão em `scripts/`; no ambiente Windows, os downloads podem precisar de `$env:NODE_USE_SYSTEM_CA='1'`. Para gerar o portátil: `npm run dist`. Quando o arquivo local oficial do Electron já existir, use `npm run dist -- --config.electronDist=.build-runtime/electron-v44.9.1-win32-x64.zip`.

## Validação desta versão

Verificadas sintaxe, interface, temas, restauração de preferências, importação/cópia estrutural de BIOS, caminhos de dados, opções de boot, carregamento nativo dos dois núcleos e tratamento de firmware ausente. Os testes específicos por versão estão descritos abaixo. Compatibilidade de títulos, áudio e desempenho exigem validação com os jogos e hardware do usuário. O desempenho depende do jogo, CPU e GPU. A abertura Kaliw é um vídeo original sem áudio de seis segundos, incluído no pacote.

## Abas BIOS e Jogos (0.4)

**BIOS:** mostra o estado de PS1 e PS2, permite importar arquivos locais, procurar BIOS numa pasta escolhida (até cinco níveis, 5.000 entradas e 100 resultados) e escolher o download do OpenBIOS. A busca só lista resultados; nada é importado sem escolha. Para PS2, há acesso à orientação oficial de extração; o catálogo não oferece BIOS Sony de terceiros.

**Jogos:** Descobrir jogos lista apenas homebrew distribuído pelos autores para plataformas integradas. Catálogo inicial: Tetrade (PS1, MIT) e NIM (PS2, GPL-3.0). Minha biblioteca oculta plataformas sem motor integrado. Há filtros por plataforma e busca por nome. Para importar jogos próprios, selecione PS1 ou PS2 no filtro.

Ao abrir uma aba, o Kaliw verifica a disponibilidade das fontes conhecidas, sem baixar conteúdo. Escolher download abre a ficha com versão, autor, licença, tamanho e origem. Apenas Baixar e instalar inicia a transferência. Há progresso e cancelamento; tamanho e SHA-256 são conferidos antes da instalação. Itens nunca são iniciados automaticamente. Os arquivos, as licenças e os links de fonte ficam em `emulation/downloads/`. Nenhuma URL arbitrária ou arquivo compactado é executado. O CUE do Tetrade é preparado automaticamente junto ao BIN. As versões do catálogo são fixadas e verificadas; a busca consulta esse catálogo inicial, não um índice irrestrito de ROMs comerciais na internet.

Testes da 0.4: download e instalação dos três itens nas fontes reais, bloqueio de hash incorreto, cancelamento, busca local, confirmação de download e filtros de plataformas. Com OpenBIOS e a imagem de disco do Tetrade, foi conferida visualmente a tela inicial do jogo após 1.500 quadros. Áudio, comandos durante a partida, PS2 com BIOS real e compatibilidade de outros títulos não foram validados.

## Alterações 0.5

A aba BIOS concentra as importações e a seleção por console, salva para o próximo boot/jogo. Automática escolhe a região no PS1; no PS2 utiliza a primeira BIOS disponível. As BIOS novas mantêm o nome original no seletor; importações antigas aparecem pelo nome gerenciado. Downloads atualizam somente progresso e texto, preservando os cartões.

Ajustes → Configurar jogadores oferece quatro perfis com teclado, controle XInput ou ambos, escolha do slot físico, remapeamento de botões/analógicos e zona morta. Clique no mapeamento e pressione a entrada; Esc cancela, Backspace limpa tecla e clique direito limpa botão/eixo. PS1 oferece digital ou DualShock. Multitap pode ser automático ou nas portas 1/2; depende do jogo. O motor PS2 agora é PCEE2 v2.9.138, com suporte real a multitap. O sistema usa as mesmas pastas de BIOS e memory cards PS2; estados rápidos de outro motor não são intercambiáveis.

Validados geração de configurações dos quatro jogadores, isolamento de entradas, multitap, seletor de BIOS, persistência, captura de teclado, progresso sem recriar cartões e carregamento nativo dos motores. Nenhum controle físico estava conectado no ambiente de teste; quatro controles simultâneos e gameplay PS2 com BIOS Sony ainda precisam de teste no hardware do usuário. Koffi 3.3.4 (MIT) consulta os quatro slots XInput do Windows.

## Alterações 0.5.1

No menu BIOS, cada imagem instalada possui Apagar BIOS, com confirmação. A exclusão remove somente a cópia gerenciada pelo Kaliw; os arquivos originais, jogos e saves são preservados. Se a BIOS escolhida for apagada, o console volta para seleção automática. A remoção fica bloqueada enquanto um jogo está iniciando ou executando.

## Alterações 0.6.0

Consoles inicia diretamente o boot sem disco. Jogos abre Minha biblioteca. Com o mesmo console aberto, Jogar agora insere o disco na sessão em execução, sem reiniciar o processo. A faixa do console oferece voltar à janela, inserir imagem local, reiniciar com a BIOS escolhida e encerrar. O PS1 também permite abrir a bandeja. Arquivos executáveis ELF/EXE e playlists não são CDs inseríveis. Para BIN, um CUE com o mesmo nome é preferido quando disponível.

A BIOS de PS1 escolhida é copiada para uma pasta de sessão com um nome reconhecido pelo motor, e os parâmetros são fixados pela ponte nativa. Os nomes gerenciados não dependem mais de uma opção enumerada incompatível. PS2 também recebe a BIOS escolhida explicitamente. A faixa mostra BIOS em uso e avisa quando a seleção foi alterada para o próximo reinício.

Leitor CD/DVD identifica unidades ópticas Windows, inclusive USB que o Windows apresente como CD-ROM. A operação lê o disco para um cache temporário antes da emulação (não é streaming direto do leitor). CDs são preparados como BIN/CUE com as faixas do TOC; DVDs ISO 9660 são preparados como ISO. A mídia permanece somente para leitura. Há progresso e cancelamento. O cache da sessão é removido após encerramento normal; leituras interrompidas são limpas. Jogos incompatíveis, discos protegidos ou danificados e alguns leitores podem não funcionar. Não houve unidade física disponível para validar o hardware real.

A ponte nativa MIT usa os callbacks libretro do motor na própria thread de emulação para abrir, selecionar e fechar a bandeja. O processo e a memória da sessão são preservados na inserção. As DLLs originais dos motores e o RetroArch permanecem intactos. Ferramentas nativas: `native/disc-bridge.c`, `native/disc-reader.c` e `native/libretro.h`; compile com `npm run build:disc-tools`, usando Zig 0.15.2. Defina KALIW_ZIG se ele estiver fora de `.build-runtime/toolchain/zig-x86_64-windows-0.15.2/zig.exe`. O script registra hashes e copia licenças do runtime C.

Validação 0.6: boot Sony PS1 local, inserção do Tetrade no mesmo PID e tela inicial do jogo; alternância entre Sony/OpenBIOS com duas BIOS presentes; encerramento e reinício limpos pelo launcher; navegação Consoles/Jogos; enumeração óptica, validação e cancelamento. O teste usa a BIOS local apenas em pastas privadas de teste; nenhuma BIOS Sony é distribuída. Boot/inserção PS2 com BIOS real e leitura física ainda precisam de validação com o hardware do usuário.

O pacote portátil usa uma pasta de extração por abertura. O aplicativo permite uma instância por pasta de dados; abrir novamente traz o launcher existente para frente.

## Alterações 0.7.0

Menu rápido sobre a emulação, com pausa real enquanto aberto. Start + Select ou Ctrl direito + Enter alternam o menu; direcional/setas navegam, A/Enter confirma e B/Esc volta ao jogo. Salvar estado grava um slot por console, BIOS, motor e caminho do jogo. Carregar retoma a partida; reiniciar preserva o disco inserido. Memory cards continuam independentes dos estados rápidos.

A barra superior usa botões com indicador animado. LB/RB ou Q/E alternam Consoles, BIOS, Jogos e Ajustes, com os atalhos visíveis ao lado das abas. Ajustes → Configurar jogadores → Atalhos do sistema permite remapear as duas entradas simultâneas do menu e as entradas de navegação. Atalhos de menu são aplicados também à sessão já aberta.

Validação: transições nativas dos atalhos, combinação simultânea, proteção contra repetição, isolamento por foco, remapeamento e gatilhos no quarto slot simulados; interface e persistência de atalhos; jogo PS1 real com pausa, gravação/carregamento, reinício mantendo CD e retorno ao launcher. Não houve controle físico conectado; o teste de teclado pelo sistema depende do foco permitido pelo Windows. Save states PS2 com BIOS real permanecem sem validação neste ambiente.

## Alterações 0.8.0

Ajustes é uma página do menu principal, sem janela ou submenu para temas, atalhos e quatro jogadores. Teclado, mouse e XInput podem navegar pelos controles. Direcional/analógico move o foco, A confirma e B volta; seletores e barras aceitam esquerda/direita. Há teclado virtual para campos de texto e seletor de arquivos interno para jogos, BIOS e CDs virtuais. As confirmações de exclusão também são navegáveis pelo controle. Recursos que abrem o Windows, como exportação de vídeo e a pasta de dados, continuam usando a interface do Windows.

Plataformas incluídas: PS1 (SwanStation), PS2 (PCEE2), Game Boy/Color (Gambatte), Game Boy Advance (mGBA), Master System (Gearsystem), Nintendinho/NES (FCEUmm), Nintendo 64 (Mupen64Plus-Next), Atari 2600 (Stella), MAME 2003-Plus, Wii (Dolphin) e Wii U (Cemu). São motores reais dentro do pacote, sem instalação separada. As bibliotecas e os filtros mostram somente plataformas integradas.

Consoles sem boot independente abrem sua biblioteca. Importe os jogos pelo filtro da plataforma. MAME requer ROMsets compatíveis especificamente com MAME 2003-Plus; arquivos de BIOS de máquinas arcade, quando exigidos pelo jogo, devem acompanhar o ROMset. Atari significa Atari 2600 nesta versão. ZIPs de cartuchos são descompactados pelo runtime; ROMsets arcade devem permanecer compactados.

Wii inclui os arquivos livres Sys do Dolphin em um arquivo compactado, preparado automaticamente na primeira utilização para reduzir o tempo de abertura do portátil. Escolha Wiimote vertical, horizontal, Nunchuk, Classic ou MotionPlus em Ajustes. Alguns jogos exigem movimentos e acessórios específicos e precisam de configuração adicional. Wii U usa GamePad no jogador 1 e permite configurar os dispositivos dos jogadores 2–4; mouse emula toque. Setas e I/J/K/L controlam os analógicos do jogador 1 em N64/Wii/Wii U quando não há teclas próprias atribuídas. Wii/Wii U requerem GPU compatível; Wii U usa OpenGL 4.5. Jogos Wii U podem precisar das fontes/chaves extraídas do seu próprio console, nas pastas system/Cemu documentadas pelo projeto. Nada disso é baixado pelo Kaliw. Cemu não oferece save states: o menu mostra essa limitação e preserva o salvamento normal dos jogos.

PS3, PS4, Xbox 360, Switch e Xbox One ainda não foram integrados e não aparecem como consoles jogáveis. Ajustes informa o estado de cada um. Não há promessa de executar essas plataformas nesta versão. RPCS3, shadPS4 e Xenia usam outras interfaces e exigem adaptadores próprios; não basta adicionar capas ou renomear um núcleo.

Validação: 11 DLLs reais carregadas; programas de teste próprios de NES, GB, GBA, Master System e Atari executados com pausa e save/load. Teste do aplicativo com importação pelo navegador interno, início de NES sem BIOS, save/load pelo menu, persistência dos controles e retorno ao launcher. Testes da interface cobrem ajustes diretos, seleção/barra, navegação espacial, confirmação e teclado virtual. Não havia controle XInput conectado. Gameplay N64, arcade, Wii e Wii U ainda requer teste com jogos e hardware do usuário.

As revisões e SHA-256 dos novos motores e fontes estão em engines/multi-manifest.json e scripts/multi-core-pins.json. As fontes correspondentes acompanham o executável; o Cemu informa uma revisão-base na versão, enquanto o port libretro é fixado separadamente. Não são distribuídos BIOS comerciais, chaves ou ROMs de terceiros.
