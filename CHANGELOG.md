# Histórico de versões

Notas recuperadas dos READMEs arquivados e, quando indicado, da comparação dos códigos preservados. Os executáveis antigos não foram recompilados.

## 0.15.0 — Instalador e pasta de dados por plataforma

- Instalador Windows x64 guiado em português, com escolha da pasta do programa e da pasta de dados, atalhos e desinstalador.
- Estrutura mínima de BIOS e Jogos para as 15 plataformas; biblioteca, preferências, saves, estados e logs usam a pasta escolhida.
- Importações de jogos criam cópias gerenciadas, incluindo os arquivos referenciados por CUE/M3U e as pastas de jogos extraídos. Arquivos originais permanecem intactos.
- Pastas de dados existentes do instalador podem ser reutilizadas. Instalar novamente ou desinstalar preserva jogos, BIOS, saves e preferências.
- O modo portátil continua usando a pasta de dados anterior quando não há configuração do instalador. Não há migração automática dos dados antigos.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.15.0)

## 0.14.0 — Sons da interface

A abertura do Kaliw tem um toque original sintetizado, e os menus têm efeitos curtos para navegar, confirmar e voltar. Mouse, teclado e controle usam o mesmo conjunto de sons, incluindo o menu rápido. A navegação tem intervalo mínimo entre efeitos para evitar sons duplicados por foco/clique. Atualizações automáticas de listas não devem produzir sons de foco.

Ajustes → Som e navegação oferece ligar/desligar e volume de 0 a 100%, com padrão de 35%. As preferências ficam no campo audio da biblioteca local e sincronizam com o menu rápido; silêncio é respeitado já na próxima abertura. O ajuste controla somente a interface, sem alterar o áudio dos jogos. A política de áudio automático é habilitada para as páginas locais do aplicativo para permitir o som de abertura sem clique prévio.

Os timbres são originais, criados com osciladores e envelopes Web Audio, sem áudio de consoles ou arquivos externos. Teste de aplicativo verificou contexto em execução, amostras digitais não nulas, abertura, navegação, volume, volume zero, silêncio após recarregar e sincronização com o menu rápido. Não houve avaliação auditiva por uma pessoa no teste automatizado.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.14.0)

## 0.13.1 — DualSense PS3 e saída do Switch

Ao iniciar um jogo PS3 com um DualSense selecionado em Ajustes, o Kaliw gera config/input_configs/global/KaliwLauncher.yml e usa --input-config KaliwLauncher. O RPCS3 utiliza seu handler nativo DualSense, com o dispositivo atribuído à porta correspondente. Teclado + controle prioriza o DualSense; remapeamentos, analógicos, gatilhos e zona morta do Kaliw são convertidos para os nomes nativos. Sem DualSense selecionado, o perfil existente do RPCS3 é preservado. Arquivos Default.yml e perfis por jogo não são sobrescritos; o override evita que um perfil antigo apenas de teclado interfira na inicialização pelo Kaliw. Options corresponde a Start, Create a Select; o botão PS não usa a combinação do menu rápido. Teste real com o jogo Miyazato confirmou o perfil carregado e DualSense device 0 connected, além de pausa, retomada e saída. Pressionamento físico dos botões não foi automatizado.

No menu rápido, o evento de fechar com o atalho retoma o processo antes de ocultar a janela. Encerrar já é considerado concluído se o motor termina durante RESUME/QUIT, sem transformar a ausência da última confirmação IPC em erro. Sair com sessão já encerrada fecha o menu e restaura o launcher. Falhas IPC com o processo ainda ativo continuam sendo reportadas. Testes cobrem encerramento nas duas etapas, saída repetida, ordem retomar/ocultar e limpeza de listeners.

A confirmação RPCS3 “Exit Game?” também é desativada no perfil Kaliw com main_window/confirmationBoxExitGame=false, reaplicada a cada inicialização. O supervisor PS3 deixa de abrir uma leitura SDL adicional: os atalhos do controle são lidos no launcher e o RPCS3 mantém seu handler nativo; atalhos de teclado continuam no supervisor. O menu só é alternado quando a janela de jogo ou do Kaliw está em primeiro plano.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.13.1)

## 0.13.0 — Switch, sensores Wii e encerramento

Switch recebe um perfil Pro Controller para até quatro jogadores a partir dos controles do Kaliw. O perfil usa o GUID e os bindings reais SDL do dispositivo selecionado; respeita remapeamento, gatilhos e analógicos. A/B seguem as posições Nintendo: Círculo = A, Cruz = B no padrão. Na origem Teclado + controle, o controle conectado tem prioridade; sem ele, usa teclado. Alterações valem no próximo início do jogo.

Durante a inicialização do Switch, uma tela Kaliw cobre a interface do motor até a janela do jogo estar em tela cheia. Usa o Eden Qt integrado; o CLI desta distribuição falhou com 0xC0000005 no teste e não é usado. Há limite de 60 segundos para a preparação; falhas retornam ao launcher com orientação para os logs. confirmStop é configurado como Ask_Never, pois o usuário já escolheu sair no menu Kaliw.

Retomar, reiniciar e fechar pelo menu rápido agora retomam o processo antes de ocultar a janela do menu. Isso evita que a ativação da janela de jogo suspensa bloqueie a interface. Teste real de DRIVE Rally confirmou boot, perfil SDL do DualSense e saída pelo menu sem sessão presa. Os botões físicos não foram pressionados pelo teste automatizado.

Wii oferece Automático, Touchpad, Movimento, Analógico direito e Mouse em Ajustes → Apontador Wii. Automático escolhe touchpad no DualSense, sensores em outros controles que os disponibilizem e analógico nos demais. Movimento usa giroscópio para apontar; sem giroscópio, usa inclinação do acelerômetro. R3 centraliza/calibra o apontador; mantenha o controle parado ao centralizar. Sacudir com intensidade suficiente emula o shake do Wiimote. Origem de entrada, porta, pausa, desconexão e expiração de amostras continuam sendo respeitadas. Sensores só são habilitados durante sessões Wii que os utilizem. Controles comuns Xbox não oferecem esses sensores ao SDL. Testes determinísticos cobrem integração, inclinação, shake, centralização e fallback; movimentos físicos de outros modelos ainda não foram validados.

RPCS3: GuiConfigs/CurrentSettings.ini é preparado com main_window/infoBoxEnabledWelcome=false em toda inicialização pelo Kaliw, inclusive perfis novos. Outros parâmetros do perfil são preservados. Isso desativa a tela de boas-vindas; o firmware PS3 continua necessário.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.13.0)

## 0.12.0 — Touchpad como apontador Wii

Ajustes → Teclado e controles → Apontador Wii permite escolher Touchpad DualSense / DualShock 4, analógico direito ou mouse. O padrão é touchpad; salve e reinicie o jogo para aplicar. Deslize um dedo para apontar em posição absoluta; clicar no touchpad equivale ao A do Wii. Círculo continua funcionando como A no mapeamento padrão. Levantar o dedo mantém a última posição. O controle físico e a origem de entrada de cada jogador são respeitados.

SDL consulta o touchpad no processo do launcher; coordenadas e clique seguem por memória compartilhada exclusiva da sessão. O núcleo RetroArch não abre outra instância SDL. O motor libera a entrada no menu rápido, desconexão ou ausência de atualizações por 500 ms. Ao encerrar a sessão, o mapeamento e o temporizador são fechados. Touchpad exige que o dispositivo real esteja acessível pelo SDL; controles virtuais XInput não fornecem a superfície de toque. Detecção do DualSense conectado confirmada; gestos físicos e conexão Bluetooth não foram validados nesta entrega.

Validação: compartilhamento real entre JS e código nativo, extremos e centro das coordenadas, clique/A e liberação, quatro portas/configuração de slot, teclado isolado, posição retida, pausa, desconexão e expiração. No aplicativo foram verificados a opção de apontador, salvar/reabrir, boot de Super Mario Galaxy com bindings absolutos Pointer e funcionamento do menu rápido. Entrada de toque simulada no teste nativo; não houve manipulação física do touchpad no teste automatizado.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.12.0)

## 0.11.2 — Tela cheia sem bordas no MAME

O MAME nativo agora ocupa o monitor inteiro em janela sem bordas, mantendo a composição do Windows disponível para o menu rápido. O supervisor remove a barra de título e moldura somente da janela do motor criado pelo Kaliw e ajusta a área ao monitor em que ela está. Outras plataformas mantêm suas configurações. A verificação geométrica confirmou área externa e área de jogo 1920x1080, sem moldura, antes do menu rápido e após retomar a mesma sessão.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.11.2)

## 0.11.1 — Menu rápido no MAME nativo

O supervisor agora ativa o menu antes de suspender o processo do motor: suspender a janela em primeiro plano antes da troca de foco podia impedir a exibição do menu no Windows. O menu usa prioridade superior e o MAME inicia em janela maximizada para permitir a sobreposição. Create + Options / Ctrl direito + Enter continuam sendo os atalhos padrão, remapeáveis em Ajustes.

Validação: jogo real MAME 0.174 em primeiro plano, combinação de teclado injetada pelo Windows, menu com foco confirmado, biblioteca da plataforma, retomada da mesma sessão e encerramento. Pausa/retomada do supervisor e remapeamento também passaram. O teste automatizado não pressionou os botões físicos do DualSense; o caminho de leitura SDL do controle permanece o mesmo.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.11.1)

## 0.11.0 — Importação PS3/PS4 e Nunchuk

O menu rápido abre com Options + Create no DualSense (Start + Select), ou Ctrl direito + Enter no teclado. Os atalhos podem ser alterados em Ajustes. No MAME nativo, Create insere ficha e Options inicia a partida; aperte os dois juntos para abrir o menu.

Wii define o dispositivo também nas opções do Dolphin para evitar iniciar como Wiimote simples e ignorar o Nunchuk. Selecione Wiimote + Nunchuk em Ajustes e reinicie o jogo. Com o mapeamento padrão, analógico esquerdo controla o Nunchuk, direito aponta, R2 sacode o Wiimote. A/B do Wii correspondem a Círculo/Cruz no DualSense; Super Mario Galaxy pede ambos na abertura.

PS3 agora reconhece ISO9660 legível/decifrada e extrai PS3_GAME para a biblioteca gerenciada. Importe a ISO na plataforma PS3; imagens protegidas ou layouts não suportados geram erro. RPCS3 ainda requer firmware PS3 importado pelo usuário.

PS4 aceita PKG base e atualização legíveis pelo importador. Selecione ambos juntos: o base é instalado primeiro e a atualização aplicada em uma nova cópia; aparece uma entrada por TITLE_ID. Atualizações sem jogo base geram orientação. DLC não é instalado por esta opção. Executáveis extraídos continuam aceitos. Não há download de chaves ou tentativa de descobrir senhas.

A importação mostra progresso, preserva os arquivos originais e usa espaço adicional em emulation/installed. A extração não garante compatibilidade de emulação. Testes com os arquivos fornecidos reconheceram Miyazato (BLJM60007), Sonic Mania (CUSA07023, versão 01.03) e a configuração Nunchuk gerada pelo Dolphin. Não foi validada a jogabilidade de PS3/PS4 nem entrada física durante essa verificação de Wii.

LibOrbisPkg v0.2, LGPL-3.0, é carregada dinamicamente pelo auxiliar Kaliw. A DLL pode ser substituída por versão compatível; o auxiliar pode ser recompilado usando scripts/build-pkg-tools.ps1. Fontes correspondentes e licenças acompanham o pacote de fontes; engines/pkg-manifest.json fixa as revisões e hashes.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.11.0)

## 0.10.0 — Mais ROMsets de arcade

MAME / Arcade mantém o núcleo 2003-Plus para os conjuntos que correspondem aos seus tamanhos e CRCs publicados e inclui o MAME Windows oficial 0.174 para outros conjuntos. O motor nativo audita o ROMset antes da inicialização, sem modificar, descompactar ou renomear o ZIP do usuário. ROMsets, arquivos de parent/BIOS e CHDs precisam corresponder à versão do motor; essa seleção não torna todos os conjuntos existentes compatíveis.

O MAME 0.174 incluído é extraído no primeiro uso, com SHA-256 fixado em engines/mame-compat-manifest.json. O motor usa GDI para apresentação, sem depender de DirectX 9 adicional. Configurações, NVRAM e perfis ficam em emulation/arcade. O perfil do Kaliw traduz teclado e até quatro controles; no DualSense, Create insere ficha e Options dá Start. O menu rápido supervisiona pausa, retorno e troca de jogo. Save state pelo menu rápido não está conectado ao MAME nativo; permanece disponível no núcleo 2003-Plus. Não há BIOS ou ROMs comerciais no pacote.

Validação: o nbbatman.zip fornecido foi aprovado por -verifyroms e executado com o DualSense reconhecido; testes verificaram pausa, retomada, encerramento e preservação do ZIP. A seleção entre motores e a tradução dos controles têm testes próprios. Fontes do MAME 0.174 estão no arquivo MAME-mame0174.zip do pacote de fontes. Licenças e avisos adicionais acompanham engines/licenses/mame0174.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.10.0)

## 0.9.9 — BIOS Master System

A importação SMS aceita dumps .sms/.bin/.rom de 8, 16, 32, 64, 128 e 256 KB. Imagens não catalogadas são identificadas como tamanho conferido, sem garantia de autenticidade ou compatibilidade. O nome original e MD5 ficam na metadata; bios.sms é a única cópia ativa do motor. Uma nova importação substitui essa cópia. As validações por hash de GB/GBC/GBA foram mantidas. Testes: 14 imagens do usuário copiadas sem alteração, BIOS modificada carregada pelo Gearsystem, preservação da cópia anterior em entradas inválidas e exclusão.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.9)

## 0.9.8 — Erro de memória ao fechar PS2

O menu libretro usa os callbacks de entrada do frontend, eliminando a segunda abertura SDL no processo do RetroArch. O encerramento PS2 foi reproduzido com STATUS_HEAP_CORRUPTION (0xC0000374) na configuração anterior; com a mudança, o teste de boot retorna código zero. Mantidos DualSense via SDL2 no frontend, atalhos remapeáveis e a lista do menu rápido. Testados select/start, gatilhos e quatro portas via callback, boot real PS2 e inserção de disco. Mensagens de encerramento agora identificam o motor, código e aba Logs.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.8)

## 0.9.7 — Jogos no menu rápido

Escolher jogo abre a biblioteca da plataforma ativa sobre o console pausado. Direcional/analógico e setas percorrem a lista; A/✕ ou Enter escolhem; B/Círculo ou Esc retornam ao menu sem fechar o console. PS1 e PS2 inserem o disco na sessão atual; outras plataformas reiniciam a sessão com o jogo escolhido. Arquivos removidos geram mensagem e a lista vazia orienta importar pelo launcher. Testes incluem inserção real de disco PS2 com identidade de sessão preservada e troca de jogo NES com retomada.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.7)

## 0.9.6 — Tela preta no PS2

PS2 usa Vulkan no frontend e no núcleo PCEE2, substituindo OpenGL que falhava ao criar contexto compartilhado WGL. O boot foi validado com BIOS do usuário em perfil isolado e imagem da tela de seleção de idioma. A sessão PS2 usa diretório de trabalho persistente para NVRAM/MEC. Logs priorizam o nível declarado pelo motor antes de estimar pelo texto.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.6)

## 0.9.5 — Importação de BIOS PS2

O seletor e a busca por pasta reconhecem .ROM0, .bin, .rom e .bios para PS2, sem diferenciar maiúsculas e minúsculas. A imagem é validada pelo conteúdo e copiada para a pasta gerenciada como .bin; o original permanece intacto. ROM1, DIFF, NVM e MEC não são tratados como a BIOS principal.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.5)

## 0.9.4 — Navegação na biblioteca

A biblioteca foca o primeiro jogo ao abrir; direcional/analógico percorre os jogos e linhas e A/✕ confirma. O foco do controle permanece visível após usar o mouse e após atualizar a lista. Os testes de interface cobrem seleção, confirmação e atualização com sessão de console aberta.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.4)

## 0.9.3 — DualSense

A detecção, navegação e remapeamento usam SDL2 em vez de consultar apenas XInput. O nome real do controle aparece em Ajustes. Os núcleos RetroArch também usam SDL2; configurações anteriores são traduzidas para o novo layout sem apagar os mapeamentos. DualSense: L1/R1 navegam entre abas; Options + Create abre o menu rápido por padrão. Reinicie o jogo após salvar mudanças de controle. Motores avançados continuam usando os seus perfis nativos.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.3)

## 0.9.2 — Visual dos filtros de jogos e BIOS

- O novo estilo de seletores passa a incluir o filtro de plataforma do catálogo e da biblioteca.
- Campos de busca e botões das barras de jogos/BIOS recebem dimensões e cantos consistentes.
- Mantém foco visível, comportamento responsivo e suporte à preferência de movimento reduzido.

Mudanças identificadas comparando os arquivos das versões 0.9.1 e 0.9.2; não há alteração dos motores nesta revisão.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.2)

## 0.9.1 — Visual dos filtros de compatibilidade, logs e mods

- Seletores com tema escuro, cantos arredondados e seta personalizada.
- Estados de foco e hover com destaque do tema, melhores dimensões e contraste.
- Ajustes de layout responsivo para os filtros de plataforma, resultado, nível, origem e jogo.

Mudanças identificadas comparando os arquivos das versões 0.9.0 e 0.9.1; não há alteração dos motores nesta revisão.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.1)

## 0.9.0 — Melhorias do launcher

- RPCS3 (PS3), shadPS4 (PS4), Xenia Canary (Xbox 360) e Eden (Switch) incluídos, extraídos no primeiro uso. Veja engines/modern-manifest.json para versões, hashes e fontes. Xbox One permanece indisponível.
- Esses motores usam seus próprios perfis de controle e configurações nativas; o menu rápido supervisiona a sessão, mas save state não está conectado nessas quatro integrações. Firmware, módulos e chaves necessários devem ser importados pelo usuário. RPCS3 exige o runtime Microsoft Visual C++ do sistema.
- BIOS mostra todas as plataformas com a necessidade específica de cada uma. Compatibilidade apresenta um snapshot de títulos e relatos publicados: títulos sem avaliação não representam jogos testados. Cobertura PS4: Windows; Xenia: até 500 relatos recentes; Eden: snapshot 0.2.1.
- Logs atualiza os registros recentes dos motores e stdout/stderr, com filtros por plataforma, origem, nível estimado e texto. Leitura limitada a 30 arquivos e 128 KB por arquivo; sequências hexadecimais longas são omitidas da exibição. Não é um trace completo de instruções.
- Mods organiza patches importados por plataforma e jogo. IPS é aplicado a uma cópia de ROMs de cartucho de até 256 MB; o usuário deve verificar revisão/região/hash exigidos pelo autor. BPS/UPS/xdelta/PPF são armazenados, sem aplicação integrada nesta versão. O botão Comunidade abre um catálogo externo; não há sincronização automática de mods.
- Inicialização dos novos motores e supervisor foram verificados; emulação de jogos comerciais e controle físico não foram validados nesta entrega.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.9.0)

## 0.8.0 — Melhorias do launcher

Ajustes é uma página do menu principal, sem janela ou submenu para temas, atalhos e quatro jogadores. Teclado, mouse e XInput podem navegar pelos controles. Direcional/analógico move o foco, A confirma e B volta; seletores e barras aceitam esquerda/direita. Há teclado virtual para campos de texto e seletor de arquivos interno para jogos, BIOS e CDs virtuais. As confirmações de exclusão também são navegáveis pelo controle. Recursos que abrem o Windows, como exportação de vídeo e a pasta de dados, continuam usando a interface do Windows.

Plataformas incluídas: PS1 (SwanStation), PS2 (PCEE2), Game Boy/Color (Gambatte), Game Boy Advance (mGBA), Master System (Gearsystem), Nintendinho/NES (FCEUmm), Nintendo 64 (Mupen64Plus-Next), Atari 2600 (Stella), MAME 2003-Plus, Wii (Dolphin) e Wii U (Cemu). São motores reais dentro do pacote, sem instalação separada. As bibliotecas e os filtros mostram somente plataformas integradas.

Consoles sem boot independente abrem sua biblioteca. Importe os jogos pelo filtro da plataforma. MAME seleciona automaticamente o núcleo 2003-Plus ou a edição Windows 0.174 conforme o conjunto; arquivos de BIOS de máquinas arcade, quando exigidos pelo jogo, devem acompanhar o ROMset. Atari significa Atari 2600 nesta versão. ZIPs de cartuchos são descompactados pelo runtime; ROMsets arcade devem permanecer compactados.

Wii inclui os arquivos livres Sys do Dolphin em um arquivo compactado, preparado automaticamente na primeira utilização para reduzir o tempo de abertura do portátil. Escolha Wiimote vertical, horizontal, Nunchuk, Classic ou MotionPlus em Ajustes. Alguns jogos exigem movimentos e acessórios específicos e precisam de configuração adicional. Wii U usa GamePad no jogador 1 e permite configurar os dispositivos dos jogadores 2–4; mouse emula toque. Setas e I/J/K/L controlam os analógicos do jogador 1 em N64/Wii/Wii U quando não há teclas próprias atribuídas. Wii/Wii U requerem GPU compatível; Wii U usa OpenGL 4.5. Jogos Wii U podem precisar das fontes/chaves extraídas do seu próprio console, nas pastas system/Cemu documentadas pelo projeto. Nada disso é baixado pelo Kaliw. Cemu não oferece save states: o menu mostra essa limitação e preserva o salvamento normal dos jogos.

PS3, PS4, Xbox 360, Switch e Xbox One ainda não foram integrados e não aparecem como consoles jogáveis. Ajustes informa o estado de cada um. Não há promessa de executar essas plataformas nesta versão. RPCS3, shadPS4 e Xenia usam outras interfaces e exigem adaptadores próprios; não basta adicionar capas ou renomear um núcleo.

Validação: 11 DLLs reais carregadas; programas de teste próprios de NES, GB, GBA, Master System e Atari executados com pausa e save/load. Teste do aplicativo com importação pelo navegador interno, início de NES sem BIOS, save/load pelo menu, persistência dos controles e retorno ao launcher. Testes da interface cobrem ajustes diretos, seleção/barra, navegação espacial, confirmação e teclado virtual. Não havia controle XInput conectado. Gameplay N64, arcade, Wii e Wii U ainda requer teste com jogos e hardware do usuário.

As revisões e SHA-256 dos novos motores e fontes estão em engines/multi-manifest.json e scripts/multi-core-pins.json. As fontes correspondentes acompanham o executável; o Cemu informa uma revisão-base na versão, enquanto o port libretro é fixado separadamente. Não são distribuídos BIOS comerciais, chaves ou ROMs de terceiros.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.8.0)

## 0.7.0 — Melhorias do launcher

Menu rápido sobre a emulação, com pausa real enquanto aberto. Start + Select ou Ctrl direito + Enter alternam o menu; direcional/setas navegam, A/Enter confirma e B/Esc volta ao jogo. Salvar estado grava um slot por console, BIOS, motor e caminho do jogo. Carregar retoma a partida; reiniciar preserva o disco inserido. Memory cards continuam independentes dos estados rápidos.

A barra superior usa botões com indicador animado. LB/RB ou Q/E alternam Consoles, BIOS, Jogos e Ajustes, com os atalhos visíveis ao lado das abas. Ajustes → Configurar jogadores → Atalhos do sistema permite remapear as duas entradas simultâneas do menu e as entradas de navegação. Atalhos de menu são aplicados também à sessão já aberta.

Validação: transições nativas dos atalhos, combinação simultânea, proteção contra repetição, isolamento por foco, remapeamento e gatilhos no quarto slot simulados; interface e persistência de atalhos; jogo PS1 real com pausa, gravação/carregamento, reinício mantendo CD e retorno ao launcher. Não houve controle físico conectado; o teste de teclado pelo sistema depende do foco permitido pelo Windows. Save states PS2 com BIOS real permanecem sem validação neste ambiente.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.7.0)

## 0.6.0 — Melhorias do launcher

Consoles inicia diretamente o boot sem disco. Jogos abre Minha biblioteca. Com o mesmo console aberto, Jogar agora insere o disco na sessão em execução, sem reiniciar o processo. A faixa do console oferece voltar à janela, inserir imagem local, reiniciar com a BIOS escolhida e encerrar. O PS1 também permite abrir a bandeja. Arquivos executáveis ELF/EXE e playlists não são CDs inseríveis. Para BIN, um CUE com o mesmo nome é preferido quando disponível.

A BIOS de PS1 escolhida é copiada para uma pasta de sessão com um nome reconhecido pelo motor, e os parâmetros são fixados pela ponte nativa. Os nomes gerenciados não dependem mais de uma opção enumerada incompatível. PS2 também recebe a BIOS escolhida explicitamente. A faixa mostra BIOS em uso e avisa quando a seleção foi alterada para o próximo reinício.

Leitor CD/DVD identifica unidades ópticas Windows, inclusive USB que o Windows apresente como CD-ROM. A operação lê o disco para um cache temporário antes da emulação (não é streaming direto do leitor). CDs são preparados como BIN/CUE com as faixas do TOC; DVDs ISO 9660 são preparados como ISO. A mídia permanece somente para leitura. Há progresso e cancelamento. O cache da sessão é removido após encerramento normal; leituras interrompidas são limpas. Jogos incompatíveis, discos protegidos ou danificados e alguns leitores podem não funcionar. Não houve unidade física disponível para validar o hardware real.

A ponte nativa MIT usa os callbacks libretro do motor na própria thread de emulação para abrir, selecionar e fechar a bandeja. O processo e a memória da sessão são preservados na inserção. As DLLs originais dos motores e o RetroArch permanecem intactos. Ferramentas nativas: `native/disc-bridge.c`, `native/disc-reader.c` e `native/libretro.h`; compile com `npm run build:disc-tools`, usando Zig 0.15.2. Defina KALIW_ZIG se ele estiver fora de `.build-runtime/toolchain/zig-x86_64-windows-0.15.2/zig.exe`. O script registra hashes e copia licenças do runtime C.

Validação 0.6: boot Sony PS1 local, inserção do Tetrade no mesmo PID e tela inicial do jogo; alternância entre Sony/OpenBIOS com duas BIOS presentes; encerramento e reinício limpos pelo launcher; navegação Consoles/Jogos; enumeração óptica, validação e cancelamento. O teste usa a BIOS local apenas em pastas privadas de teste; nenhuma BIOS Sony é distribuída. Boot/inserção PS2 com BIOS real e leitura física ainda precisam de validação com o hardware do usuário.

O pacote portátil usa uma pasta de extração por abertura. O aplicativo permite uma instância por pasta de dados; abrir novamente traz o launcher existente para frente.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.6.0)

## 0.5.1 — Melhorias do launcher

No menu BIOS, cada imagem instalada possui Apagar BIOS, com confirmação. A exclusão remove somente a cópia gerenciada pelo Kaliw; os arquivos originais, jogos e saves são preservados. Se a BIOS escolhida for apagada, o console volta para seleção automática. A remoção fica bloqueada enquanto um jogo está iniciando ou executando.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.5.1)

## 0.5.0 — Melhorias do launcher

A aba BIOS concentra as importações e a seleção por console, salva para o próximo boot/jogo. Automática escolhe a região no PS1; no PS2 utiliza a primeira BIOS disponível. As BIOS novas mantêm o nome original no seletor; importações antigas aparecem pelo nome gerenciado. Downloads atualizam somente progresso e texto, preservando os cartões.

Ajustes → Configurar jogadores oferece quatro perfis com teclado, controle XInput ou ambos, escolha do slot físico, remapeamento de botões/analógicos e zona morta. Clique no mapeamento e pressione a entrada; Esc cancela, Backspace limpa tecla e clique direito limpa botão/eixo. PS1 oferece digital ou DualShock. Multitap pode ser automático ou nas portas 1/2; depende do jogo. O motor PS2 agora é PCEE2 v2.9.138, com suporte real a multitap. O sistema usa as mesmas pastas de BIOS e memory cards PS2; estados rápidos de outro motor não são intercambiáveis.

Validados geração de configurações dos quatro jogadores, isolamento de entradas, multitap, seletor de BIOS, persistência, captura de teclado, progresso sem recriar cartões e carregamento nativo dos motores. Nenhum controle físico estava conectado no ambiente de teste; quatro controles simultâneos e gameplay PS2 com BIOS Sony ainda precisam de teste no hardware do usuário. Koffi 3.3.4 (MIT) consulta os quatro slots XInput do Windows.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.5.0)

## 0.4.0 — Abas BIOS e Jogos (0.4)

**BIOS:** mostra o estado de PS1 e PS2, permite importar arquivos locais, procurar BIOS numa pasta escolhida (até cinco níveis, 5.000 entradas e 100 resultados) e escolher o download do OpenBIOS. A busca só lista resultados; nada é importado sem escolha. Para PS2, há acesso à orientação oficial de extração; o catálogo não oferece BIOS Sony de terceiros.

**Jogos:** Descobrir jogos lista apenas homebrew distribuído pelos autores para plataformas integradas. Catálogo inicial: Tetrade (PS1, MIT) e NIM (PS2, GPL-3.0). Minha biblioteca oculta plataformas sem motor integrado. Há filtros por plataforma e busca por nome. Para importar jogos próprios, selecione PS1 ou PS2 no filtro.

Ao abrir uma aba, o Kaliw verifica a disponibilidade das fontes conhecidas, sem baixar conteúdo. Escolher download abre a ficha com versão, autor, licença, tamanho e origem. Apenas Baixar e instalar inicia a transferência. Há progresso e cancelamento; tamanho e SHA-256 são conferidos antes da instalação. Itens nunca são iniciados automaticamente. Os arquivos, as licenças e os links de fonte ficam em `emulation/downloads/`. Nenhuma URL arbitrária ou arquivo compactado é executado. O CUE do Tetrade é preparado automaticamente junto ao BIN. As versões do catálogo são fixadas e verificadas; a busca consulta esse catálogo inicial, não um índice irrestrito de ROMs comerciais na internet.

Testes da 0.4: download e instalação dos três itens nas fontes reais, bloqueio de hash incorreto, cancelamento, busca local, confirmação de download e filtros de plataformas. Com OpenBIOS e a imagem de disco do Tetrade, foi conferida visualmente a tela inicial do jogo após 1.500 quadros. Áudio, comandos durante a partida, PS2 com BIOS real e compatibilidade de outros títulos não foram validados.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.4.0)

## 0.3.0 — Emulação integrada de PS1 e PS2

- RetroArch, SwanStation (PS1) e ParaLLEl PS2 incluídos no aplicativo, sem instalação separada.
- Importação local de BIOS, boot sem disco, início de jogos em tela cheia e retorno ao launcher.
- Saves, estados, sessões e logs ficam na pasta persistente de dados.
- Temas e carrossel mantidos, com créditos e fontes dos motores incluídos.

Na validação original foram conferidos carregamento dos núcleos e tratamento de BIOS ausente; gameplay e boots completos com BIOS reais ainda não tinham sido validados.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.3.0)

## 0.2.0 — Temas, animações e capas sem repetição

- Carrossel com uma capa por console configurado e telas de orientação quando não há emulador ou jogos.
- Quatro temas, estilos de capas e intensidade das animações configuráveis, com preferências locais.
- Efeitos visuais de interação e respeito à preferência de movimento reduzido.
- Mantém a execução por emuladores externos; os motores integrados chegam na 0.3.0.

As fontes anexadas foram recuperadas do app.asar do executável original; arquivos de desenvolvimento ausentes do pacote não foram reconstruídos.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.2.0)

## 0.1.0 — Primeiro launcher Windows

- Primeira interface Kaliw com vídeo de abertura, carrossel de consoles e biblioteca local de PS1 e PS2.
- Importação e remoção de jogos, seleção de executáveis externos e opção de boot completo.
- Nesta versão os emuladores precisam ser configurados separadamente; ainda não existem motores integrados.

As fontes anexadas foram recuperadas do app.asar do executável original. Esse arquivo preserva o código distribuído, mas não recupera os arquivos de desenvolvimento que não foram empacotados.

[Release](https://github.com/wesmagador/KaliwLauncher/releases/tag/v0.1.0)
