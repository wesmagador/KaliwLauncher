(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KaliwPlatforms=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){return {

  "platforms": [

    {

      "id": "ps2",

      "name": "PlayStation 2",

      "symbol": "PS2",

      "year": "2000",

      "vendor": "Sony",

      "core": "pcee2",

      "engine": "PCEE2",

      "bios": true,

      "boot": true,

      "disc": true,

      "extensions": [

        "iso",

        "chd",

        "cso",

        "gz",

        "elf",

        "m3u"

      ],

      "description": "Uma geração inteira de histórias inesquecíveis.",

      "console": "ps2",

      "file": "pcee2_libretro.dll"

    },

    {

      "id": "ps1",

      "name": "PlayStation",

      "symbol": "PS",

      "year": "1994",

      "vendor": "Sony",

      "core": "swanstation",

      "engine": "SwanStation",

      "bios": true,

      "boot": true,

      "disc": true,

      "extensions": [

        "cue",

        "chd",

        "pbp",

        "m3u",

        "iso",

        "bin",

        "exe"

      ],

      "description": "Onde a revolução em 3D começou.",

      "console": "ps1",

      "file": "swanstation_libretro.dll"

    },

    {

      "id": "gb",

      "name": "Game Boy / Color",

      "symbol": "GB",

      "year": "1989",

      "vendor": "Nintendo",

      "core": "gambatte",

      "engine": "Gambatte",

      "extensions": [

        "gb",

        "gbc",

        "dmg",

        "zip"

      ],

      "repo": "libretro/gambatte-libretro",

      "description": "Os clássicos portáteis, do verde ao colorido.",

      "console": "gb",

      "file": "gambatte_libretro.dll"

    },

    {

      "id": "gba",

      "name": "Game Boy Advance",

      "symbol": "GBA",

      "year": "2001",

      "vendor": "Nintendo",

      "core": "mgba",

      "engine": "mGBA",

      "extensions": [

        "gba",

        "agb",

        "zip"

      ],

      "repo": "libretro/mgba",

      "description": "Uma nova aventura na palma da mão.",

      "console": "gba",

      "file": "mgba_libretro.dll"

    },

    {

      "id": "sms",

      "name": "Master System",

      "symbol": "MS",

      "year": "1985",

      "vendor": "SEGA",

      "core": "gearsystem",

      "engine": "Gearsystem",

      "extensions": [

        "sms",

        "sg",

        "zip"

      ],

      "repo": "drhelius/Gearsystem",

      "description": "A era dos 8 bits da SEGA.",

      "console": "sms",

      "file": "gearsystem_libretro.dll"

    },

    {

      "id": "nes",

      "name": "Nintendinho / NES",

      "symbol": "NES",

      "year": "1983",

      "vendor": "Nintendo",

      "core": "fceumm",

      "engine": "FCEUmm",

      "extensions": [

        "nes",

        "unf",

        "unif",

        "zip"

      ],

      "repo": "libretro/libretro-fceumm",

      "description": "O início de tantas histórias.",

      "console": "nes",

      "file": "fceumm_libretro.dll"

    },

    {

      "id": "n64",

      "name": "Nintendo 64",

      "symbol": "N64",

      "year": "1996",

      "vendor": "Nintendo",

      "core": "mupen64plus_next",

      "engine": "Mupen64Plus-Next",

      "video": "glcore",

      "extensions": [

        "z64",

        "n64",

        "v64",

        "zip"

      ],

      "repo": "libretro/mupen64plus-libretro-nx",

      "description": "Explore mundos em três dimensões.",

      "console": "n64",

      "file": "mupen64plus_next_libretro.dll"

    },

    {

      "id": "atari",

      "name": "Atari 2600",

      "symbol": "2600",

      "year": "1977",

      "vendor": "Atari",

      "core": "stella",

      "engine": "Stella",

      "extensions": [

        "a26",

        "bin",

        "rom",

        "zip"

      ],

      "repo": "libretro/stella",

      "description": "De volta às origens dos videogames.",

      "console": "atari",

      "file": "stella_libretro.dll"

    },

    {

      "id": "mame",

      "name": "MAME 2003-Plus",

      "symbol": "MAME",

      "year": "1978",

      "vendor": "Arcade",

      "core": "mame2003_plus",

      "engine": "MAME 2003-Plus",

      "extensions": [

        "zip"

      ],

      "repo": "libretro/mame2003-plus-libretro",

      "description": "Arcades clássicos. Requer ROMsets compatíveis com MAME 2003-Plus.",

      "console": "mame",

      "file": "mame2003_plus_libretro.dll"

    },

    {

      "id": "wii",

      "name": "Nintendo Wii",

      "symbol": "Wii",

      "year": "2006",

      "vendor": "Nintendo",

      "core": "dolphin",

      "engine": "Dolphin",

      "video": "glcore",

      "extensions": [

        "iso",

        "wbfs",

        "rvz",

        "gcz",

        "wad",

        "dol",

        "elf"

      ],

      "repo": "libretro/dolphin",

      "description": "Jogos com Wiimote emulado. Compatibilidade depende do jogo.",

      "console": "wii",

      "file": "dolphin_libretro.dll"

    },

    {

      "id": "wiiu",

      "name": "Nintendo Wii U",

      "symbol": "WiiU",

      "year": "2012",

      "vendor": "Nintendo",

      "core": "cemu",

      "engine": "Cemu",

      "video": "glcore",

      "noStates": true,

      "extensions": [

        "iso",

        "tmd",

        "wua",

        "wud",

        "wux",

        "rpx",

        "elf"

      ],

      "repo": "WizzardSK/cemu-libretro",

      "description": "GamePad emulado. Requer GPU com OpenGL 4.5 ou Vulkan.",

      "console": "wiiu",

      "file": "cemu_libretro.dll"

    }

  ],

  "pending": [

    {

      "name": "PlayStation 3",

      "project": "RPCS3"

    },

    {

      "name": "PlayStation 4",

      "project": "shadPS4"

    },

    {

      "name": "Xbox 360",

      "project": "Xenia"

    },

    {

      "name": "Nintendo Switch",

      "project": "Integração específica pendente"

    },

    {

      "name": "Xbox One",

      "project": "Sem motor integrado verificado"

    }

  ]

};});

