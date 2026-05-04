const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 3000;

// ─── Questions ──────────────────────────────────────────────────────────────
// You can also load from questions.txt — one question per line
let QUESTIONS = [];
const questionsFile = path.join(__dirname, "questions.txt");
if (fs.existsSync(questionsFile)) {
  QUESTIONS = fs.readFileSync(questionsFile, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
} else {
  QUESTIONS = [
    "Do you prefer coffee or tea?",
    "What's your favourite season?",
    "Are you more of a morning person or a night owl?",
    "What's the last show you binge-watched?",
    "What's your comfort food?",
    "Do you have any pets?",
    "What's your go-to karaoke song?",
    "Beach or mountains?",
    "What superpower would you choose?",
    "What's the worst movie you've ever seen?",
    "What's something you're secretly good at?",
    "Would you rather explore space or the deep ocean?",
    "What's the weirdest food you've ever tried?",
    "Who was your childhood hero?",
    "What's your biggest irrational fear?",
    "What would your autobiography be titled?",
    "What emoji describes you best?",
    "Do you believe in ghosts?",
    "What's a skill you wish you had?",
    "What was your first job?",
    "What's the most useless talent you have?",
    "Would you rather always be too hot or too cold?",
    "What game show would you crush it on?",
    "What's something everyone else likes that you hate?",
    "If you could eat one meal forever, what would it be?",
    "What's the bravest thing you've ever done?",
    "What's a dealbreaker in a friendship?",
    "What's your most controversial opinion?",
    "What's the most embarrassing thing you own?",
    "What's one thing you'd tell your 10-year-old self?",
  ];
}

// ─── Identities ─────────────────────────────────────────────────────────────
const IDENTITIES = [
  { name: "Hérvé",     avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500575722148987031/Screenshot_20260330_182917_TikTok.jpg?ex=69f8ef8b&is=69f79e0b&hm=e04eadfbf5f3930dd6ef6598a862eb4dc07b48c2feb2b380abe1d771c5d0f44d&"   },
  { name: "Marzouka",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500582792390774885/images_5.png?ex=69f8f621&is=69f7a4a1&hm=6f094311cfd846629e6782f5f578f25097dd9b8fa2a03df46e8ccd2d8b458c3c&"       },
  { name: "Bassem",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500582901266387035/ab67616d0000b2739bbe733b8e89b0012740b69b.png?ex=69f8f63b&is=69f7a4bb&hm=dd8efc9997a78c78103cc8b7d2f28a3204e23a1e69e751dff42ae56fad8254ba&"    },
  { name: "Asterion",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500583583222595714/OcaRfoTCWk2O4DmXjFA8Sct8hwTzMpkGxC8OwIssmB5zGjiSO6CsD0Ru0NYzlzdaGJZNLGhls900-c-k-c0x00ffffff-no-rj.png?ex=69f8f6dd&is=69f7a55d&hm=042a72735e70f6d8008e741e6388344ce8ad7a3c617033b07aeef3438c172a0c&"  },
  { name: "Mobutu",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500583987842777219/Mobutu.png?ex=69f8f73e&is=69f7a5be&hm=7fe2dd0b04bf2a578cebac1d162a00987d8142d695b66b872e6ad4b96a89b93d&"    },
  { name: "IbraTV",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500584618414571641/ibra-tv-mma-2.png?ex=69f8f7d4&is=69f7a654&hm=f0b8beb95bd2cae694e641e98e7c34b6f96b6ebfe0feda2e691c680c7d061902&"    },
  { name: "Yassin",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500585048410161296/IMG_1351.png?ex=69f8f83b&is=69f7a6bb&hm=b57fa184a3e8ed98783fa2bdf9432319b75f518746be3e016a238648d6d61b27&"   },
  { name: "Dano",      avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500585326110970037/363012549_10230815780888488_896101427181862810_n.png?ex=69f8f87d&is=69f7a6fd&hm=343044cece8e3634c14c83975b83b030e4252734ab2429ca97234661720e493d&"   },
  { name: "Walter",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500585587051200626/8Ze_xyag8md_Ru4BNqHfSc-H81xpBi5SbxZp0T3BT95ddp05qOdW7dzDh-ZVsqXvGeRMXQpM1Rn8xa8nf7sEBIPB.jpg?ex=69f8f8bb&is=69f7a73b&hm=4c8c44b0fb261b29582d3e167e44ff7cd4cb755808c3edef672a4a572778b91f&"   },
  { name: "KebabMan",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1339897573825052673/kebab-machine-he-doesnt-look-as-good-as-i-thought-he-will-v0-fxddt6gynrnd1.jpg?ex=69f86cdb&is=69f71b5b&hm=6cc49a7213d762f875d658057380ca657c75bb2ff07d92ed351ec3816672fb4d&"    },

  { name: "Mustapha Atatürk",   avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500605862132187219/what-skins-do-you-guys-think-homelander-will-have-v0-u8fxco5nfzsb1.png?ex=69f90b9d&is=69f7ba1d&hm=7f59e8aade6c99aa4d0da68111968565c9526f46e8f0bfe50f19f605a570d5f8&"   },
  { name: "Kratos Messi",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500606165665710220/kratosmessi-kratos.png?ex=69f90be5&is=69f7ba65&hm=62f0ea2c5a9bd3182405279f81b6a0678e9c6402fedc5d78d2c108dd644f9a35&"       },
  { name: "Sale Juif",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500606473733148783/GAD_ELMALEH_20240771R2-copie2.png?ex=69f90c2f&is=69f7baaf&hm=23f578379832793614ffe0bc02b36feeddc3a9f27b696d831a2386e464b48fa8&"    },
  { name: "René la taupe",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500606637965185024/vente_peluche-rene-la-taupe--23-cm-jemini-14188.png?ex=69f90c56&is=69f7bad6&hm=66823f1eb0cabfaabeb543fcc9d95667ff1cf92180add8767de9bc687daa7c5d&"  },
  { name: "Jorblin Jeapnis",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500606900385874000/GK1CR6kXgAAhU-u.png?ex=69f90c94&is=69f7bb14&hm=3526b6bcdb21e4dc8bf20ef8ad177cc9d1261b32e8d3f81302cbdf84fb28775a&"    },
  { name: "Sigma Ronaldo",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500607248248864899/images_6.jpeg?ex=69f90ce7&is=69f7bb67&hm=22eab3678bc814a46a9d42e61c75cc9225234f7ea5b9407365a4687f1a3162e9&"    },
  { name: "Mloukhia",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500607634699583609/grossiste-amilcar-mloukhia-tunisie_MLO2K350.png?ex=69f90d44&is=69f7bbc4&hm=62b331e0ade94477cabe25bb25cf1c9b262cee99b492f256bca4e29feaa2715e&"   },
  { name: "LSD",      avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500608184518312076/Screenshot_20260113_074313_TikTok.jpg?ex=69f90dc7&is=69f7bc47&hm=ab045a0a5cffc3dc432e1da5db0db014c0312f038e67585d151101923ca95dbb&"   },

  { name: "Freakbob",   avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500930182624579614/artworks-zrrfeImrXlC7KVfZ-fybnBg-t1080x1080.png?ex=69fa39a9&is=69f8e829&hm=d02b20976284c9086f88ba292d8fd1e33d7a6667c88a53499dab423d640c97ba&"   },
  { name: "Monsieur Patate",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500935739259752519/Mpatate.png?ex=69fa3ed6&is=69f8ed56&hm=339fb3096f4eeb0b16fd7fea48015fbe40aff2dbfca19c24c565a13ec882e219&"       },
  { name: "Un Kilo De Blague De Jean Marie Bigard",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500935925889372240/81u56dPrKsL._AC_UF10001000_QL80_.png?ex=69fa3f02&is=69f8ed82&hm=6c4c8ee26f3b094c83c50f5a8daafcd85ef1c2de785b9df7a2124fa399135bb7&"    },
  { name: "Void Grub",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500936147210076200/latest.png?ex=69fa3f37&is=69f8edb7&hm=71354b76a33fa65e24706ac7f1387e63a12ec5829cd448ec7e398c7701e54348&"  },
  { name: "Siphano",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500936326667571300/250.png?ex=69fa3f62&is=69f8ede2&hm=ac0ec9298f261ae34796cfaa453538e69883857db063e64796fe1cb70da2be69&"    },
  { name: "Fluffy (Le Clebard De Bastient)",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500937387772088481/607075588_17843660739666099_1274751738004987700_n.jpg?ex=69fa405f&is=69f8eedf&hm=6beb4ce266ea8264ed9c58999b63d433a4847d4fee65b0809dbde5c3cb2e3271&"    },
  { name: "Chouffin",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500939156799492136/chouffin_chapeau.png?ex=69fa4205&is=69f8f085&hm=d5d04023a6e8ec82e3fc99d894c45c055fdba34ab0c5976eea0177b780da1b93&"   },
  { name: "Joel",      avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500939360025968804/latest.png?ex=69fa4235&is=69f8f0b5&hm=b352595f874bf28ac07a4c157b5cc200a1ecf3a3c52a6e83cbe7a123ac9d09a7&"   },

  { name: "Poulet Miam",   avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500939739333918741/34rs4ucrdvge1.png?ex=69fa428f&is=69f8f10f&hm=350ad2895b1b2ac2781207498550f8d789a98ffa8ade422dde9fa09b263ae65f&"   },
  { name: "Steve",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500940008050135240/dPZQvFRbjEq3XCg37rBgWo.png?ex=69fa42d0&is=69f8f150&hm=28ec0898eda7b0c6e8644dc6e0b25b0e3c07d65c8ea803335a8d7c3b63675895&"       },
  { name: "Asuna",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500940121850253352/latest.png?ex=69fa42eb&is=69f8f16b&hm=48dd2dab898dd3cd74ee2331748e650b481acb04a8ce82cc0e3060401d8d3a82&"    },
  { name: "OmniMan Whatsapp",  avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500940494501318738/ec5cd195d7c0da0176fdd508369b2c3d.png?ex=69fa4344&is=69f8f1c4&hm=5ee33dca534337d9f4e263038b7428c8c0f6ba4a76ce7c3650cb717373aa9022&"  },
  { name: "Gordo",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500940973843415111/Gordo_KSSU_artwork.png?ex=69fa43b6&is=69f8f236&hm=0e811d7cf85783481d5c3b1edb1407bef5d22c7ffa95c294e0e0eafa8e7f307c&"    },
  { name: "Igor Boggdanov",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500941923806875758/250px-Salon_du_livre_de_Paris_2011_-_Igor_Bogdanov_-_004.png?ex=69fa4498&is=69f8f318&hm=eb0ab3361c4d0f05e9abc3ea381b5b1c1f8ae0a018a98302ebb7efc380eba690&"    },
  { name: "Rhum de monsieur Pacoud",    avatar: "https://cdn.discordapp.com/attachments/1011964154875224135/1500943138951397376/03267130032470-z1r1-s01.png?ex=69fa45ba&is=69f8f43a&hm=b7f3b9f62c4210fd6cca13dbaed6e9f1b99c62b8e18dc4e07519d7da63d13168&"   },
];

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Player
 * @property {string} id
 * @property {string} username
 * @property {string} lobbyCode
 * @property {{ name: string, avatar: string }|null} identity
 * @property {string[]} chatAnswers  – messages sent this round
 * @property {boolean} hasAnswered   – answered current question
 * @property {Object.<string,string>} matchingGuesses – { fakeName: realUsername }
 * @property {number} points
 */

/**
 * @typedef {Object} Lobby
 * @property {string} code
 * @property {string} masterId  – socket id of game master
 * @property {'waiting'|'playing'|'matching'|'results'} phase
 * @property {number} questionIndex
 * @property {number[]} questionOrder – shuffled indices
 * @property {Map<string, Player>} players
 * @property {Array<{pseudo:string, username:string, text:string}>} chatLog
 */

/** @type {Map<string, Lobby>} */
const lobbies = new Map();

// ─── Lobby Helpers ────────────────────────────────────────────────────────────

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Assign unique identities to all players in a lobby */
function assignIdentities(lobby) {
  const pool = shuffle(IDENTITIES).slice(0, lobby.players.size);
  let i = 0;
  for (const player of lobby.players.values()) {
    player.identity = pool[i++];
  }
}

function lobbyPublicState(lobby) {
  return {
    code: lobby.code,
    masterId: lobby.masterId,
    phase: lobby.phase,
    players: [...lobby.players.values()].map((p) => ({
      id: p.id,
      username: p.username,
      isMaster: p.id === lobby.masterId,
    })),
  };
}

function emitLobbyState(lobby) {
  io.to(lobby.code).emit("lobby_state", lobbyPublicState(lobby));
}

function currentQuestion(lobby) {
  return QUESTIONS[lobby.questionOrder[lobby.questionIndex]];
}

function allAnswered(lobby) {
  return [...lobby.players.values()].every((p) => p.hasAnswered);
}

function broadcastQuestion(lobby) {
  io.to(lobby.code).emit("new_question", {
    text: currentQuestion(lobby),
    index: lobby.questionIndex,
    total: lobby.questionCount,
  });

  // Reset answered flag
  for (const p of lobby.players.values()) p.hasAnswered = false;
}

function startMatchingPhase(lobby) {
  lobby.phase = "matching";

  const identities = [...lobby.players.values()].map((p) => ({
    fakeName: p.identity.name,
    avatar: p.identity.avatar,
  }));

  const usernames = [...lobby.players.values()].map((p) => p.username);

  io.to(lobby.code).emit("matching_phase", { identities, usernames });
}

function computeResults(lobby) {
  lobby.phase = "results";

  // Build ground truth: fakeName → username
  const truth = {};
  for (const p of lobby.players.values()) {
    truth[p.identity.name] = p.username;
  }

  // Score players
  for (const player of lobby.players.values()) {
    player.points = 0;
    for (const [fakeName, guessedUsername] of Object.entries(player.matchingGuesses)) {
      if (truth[fakeName] === guessedUsername) {
        player.points += 1;
      }
    }
  }

  const leaderboard = [...lobby.players.values()]
    .sort((a, b) => b.points - a.points)
    .map((p) => ({ username: p.username, points: p.points }));

  io.to(lobby.code).emit("results", {
    truth,
    leaderboard,
    // Send each player's identity too for reveal
    identities: [...lobby.players.values()].map((p) => ({
      username: p.username,
      fakeName: p.identity.name,
      avatar: p.identity.avatar,
    })),
  });
}

// ─── Socket Events ────────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log(`[CONNECT] ${socket.id}`);

  // ── Create Lobby ───────────────────────────────────────────────────────────
  socket.on("create_lobby", ({ username }, cb) => {
    if (!username?.trim()) return cb({ error: "Username required" });

    let code = generateCode();
    while (lobbies.has(code)) code = generateCode();

    /** @type {Player} */
    const master = {
      id: socket.id,
      username: username.trim(),
      lobbyCode: code,
      identity: null,
      chatAnswers: [],
      hasAnswered: false,
      matchingGuesses: {},
      points: 0,
    };

    /** @type {Lobby} */
    const lobby = {
      code,
      masterId: socket.id,
      phase: "waiting",
      questionIndex: 0,
      questionOrder: [],
      players: new Map([[socket.id, master]]),
      chatLog: [],
    };

    lobbies.set(code, lobby);
    socket.join(code);

    console.log(`[LOBBY] Created ${code} by ${username}`);
    cb({ code });
    emitLobbyState(lobby);
  });

  // ── Join Lobby ─────────────────────────────────────────────────────────────
  socket.on("join_lobby", ({ username, code }, cb) => {
    if (!username?.trim()) return cb({ error: "T'as besoins d'un pseudo sale golmon" });
    const lobby = lobbies.get(code?.toUpperCase());
    if (!lobby) return cb({ error: "Lobby pas trouver" });
    if (lobby.phase !== "waiting") return cb({ error: "La game a deja commencer bouffon" });
    if (lobby.players.size >= IDENTITIES.length)
      return cb({ error: "le lobby est complet bouhouhou" });

    const taken = [...lobby.players.values()].some(
      (p) => p.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (taken) return cb({ error: "Pseudo deja pris sale triso" });

    /** @type {Player} */
    const player = {
      id: socket.id,
      username: username.trim(),
      lobbyCode: code.toUpperCase(),
      identity: null,
      chatAnswers: [],
      hasAnswered: false,
      matchingGuesses: {},
      points: 0,
    };

    lobby.players.set(socket.id, player);
    socket.join(code.toUpperCase());

    console.log(`[JOIN] ${username} → ${code}`);
    cb({ code: code.toUpperCase() });
    emitLobbyState(lobby);
  });

  // ── Start Game ─────────────────────────────────────────────────────────────
  socket.on("start_game", ({ questionCount } = {}, cb) => {
    const player = findPlayer(socket.id);
    if (!player) return cb?.({ error: "Not in a lobby" });
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby) return cb?.({ error: "Lobby not found" });
    if (lobby.masterId !== socket.id) return cb?.({ error: "t'es pas le boss" });
    if (lobby.players.size < 2) return cb?.({ error: "Faut au moins 2 joueurs meme si c'est pas ouf" });

    // Clamp questionCount to available questions, default 30
    const count = Math.min(
      Math.max(parseInt(questionCount, 10) || 30, 1),
      QUESTIONS.length
    );

    assignIdentities(lobby);
    lobby.phase = "playing";
    lobby.questionIndex = 0;
    lobby.questionCount = count;
    lobby.chatLog = [];
    lobby.questionOrder = shuffle([...Array(QUESTIONS.length).keys()]).slice(0, count);

    // Tell each player their fake identity privately
    for (const p of lobby.players.values()) {
      io.to(p.id).emit("your_identity", {
        name: p.identity.name,
        avatar: p.identity.avatar,
      });
    }

    // Send full player list with fake identities (no real names)
    io.to(lobby.code).emit("game_started", {
      players: [...lobby.players.values()].map((p) => ({
        id: p.id,
        fakeName: p.identity.name,
        avatar: p.identity.avatar,
      })),
    });

    broadcastQuestion(lobby);
    cb?.({ ok: true });
  });

  // ── Chat Message / Answer ──────────────────────────────────────────────────
  socket.on("send_message", ({ text }) => {
    const player = findPlayer(socket.id);
    if (!player) return;
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby || lobby.phase !== "playing") return;
    if (!text?.trim()) return;

    // Mark as answered
    player.hasAnswered = true;

    const msg = {
      id: socket.id,
      pseudo: player.identity.name,
      avatar: player.identity.avatar,
      text: text.trim(),
      ts: Date.now(),
    };
    lobby.chatLog.push(msg);
    io.to(lobby.code).emit("chat_message", msg);

    // Check if all answered → advance
    if (allAnswered(lobby)) {
      lobby.questionIndex += 1;
      if (lobby.questionIndex >= lobby.questionCount) {
        startMatchingPhase(lobby);
      } else {
        setTimeout(() => broadcastQuestion(lobby), 800);
      }
    }
  });

  // ── Matching Submission ────────────────────────────────────────────────────
  socket.on("submit_matching", ({ guesses }) => {
    // guesses: { [fakeName]: realUsername }
    const player = findPlayer(socket.id);
    if (!player) return;
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby || lobby.phase !== "matching") return;

    player.matchingGuesses = guesses;
    player.hasAnswered = true;

    io.to(lobby.code).emit("matching_progress", {
      submitted: [...lobby.players.values()].filter((p) => p.hasAnswered).length,
      total: lobby.players.size,
    });

    if (allAnswered(lobby)) {
      computeResults(lobby);
    }
  });

  // ── Play Again ─────────────────────────────────────────────────────────────
  socket.on("play_again", () => {
    const player = findPlayer(socket.id);
    if (!player) return;
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby || lobby.masterId !== socket.id) return;

    lobby.phase = "waiting";
    lobby.questionIndex = 0;
    lobby.chatLog = [];
    for (const p of lobby.players.values()) {
      p.identity = null;
      p.hasAnswered = false;
      p.matchingGuesses = {};
      p.points = 0;
      p.chatAnswers = [];
    }
    emitLobbyState(lobby);
    io.to(lobby.code).emit("reset_to_lobby");
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const player = findPlayer(socket.id);
    if (!player) return;
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby) return;

    console.log(`[LEAVE] ${player.username} (${socket.id})`);
    lobby.players.delete(socket.id);

    if (lobby.players.size === 0) {
      lobbies.delete(lobby.code);
      console.log(`[LOBBY] Deleted ${lobby.code} (empty)`);
      return;
    }

    // Transfer master if needed
    if (lobby.masterId === socket.id) {
      lobby.masterId = lobby.players.keys().next().value;
      io.to(lobby.masterId).emit("you_are_master");
    }

    emitLobbyState(lobby);

    // If game was in progress and everyone answered except disconnected player, advance
    if (lobby.phase === "playing" && allAnswered(lobby)) {
      lobby.questionIndex += 1;
      if (lobby.questionIndex >= lobby.questionCount) {
        startMatchingPhase(lobby);
      } else {
        broadcastQuestion(lobby);
      }
    }
  });
});

function findPlayer(socketId) {
  for (const lobby of lobbies.values()) {
    if (lobby.players.has(socketId)) return lobby.players.get(socketId);
  }
  return null;
}

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) =>
  res.sendFile(path.join(__dirname, "public", "index.html"))
);

httpServer.listen(PORT, () => console.log(`🎭 Incognito running on port ${PORT}`));
