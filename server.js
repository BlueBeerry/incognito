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
  { name: "Maurice",   avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Maurice&backgroundColor=b6e3f4"   },
  { name: "Léo",       avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Leo&backgroundColor=ffdfbf"       },
  { name: "Adrien",    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Adrien&backgroundColor=c0aede"    },
  { name: "Jean-Paul", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=JeanPaul&backgroundColor=d1f4d1"  },
  { name: "Robert",    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Robert&backgroundColor=ffd6e0"    },
  { name: "Gérard",    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Gerard&backgroundColor=ffe0b2"    },
  { name: "Fernand",   avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Fernand&backgroundColor=e0f7fa"   },
  { name: "Lucette",   avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Lucette&backgroundColor=fce4ec"   },
  { name: "Monique",   avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Monique&backgroundColor=f3e5f5"   },
  { name: "Yvette",    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Yvette&backgroundColor=e8f5e9"    },
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
    total: 30,
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
    if (!username?.trim()) return cb({ error: "Username required" });
    const lobby = lobbies.get(code?.toUpperCase());
    if (!lobby) return cb({ error: "Lobby not found" });
    if (lobby.phase !== "waiting") return cb({ error: "Game already started" });
    if (lobby.players.size >= IDENTITIES.length)
      return cb({ error: "Lobby is full" });

    const taken = [...lobby.players.values()].some(
      (p) => p.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (taken) return cb({ error: "Username already taken" });

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
  socket.on("start_game", (_, cb) => {
    const player = findPlayer(socket.id);
    if (!player) return cb?.({ error: "Not in a lobby" });
    const lobby = lobbies.get(player.lobbyCode);
    if (!lobby) return cb?.({ error: "Lobby not found" });
    if (lobby.masterId !== socket.id) return cb?.({ error: "Not master" });
    if (lobby.players.size < 2) return cb?.({ error: "Need at least 2 players" });

    assignIdentities(lobby);
    lobby.phase = "playing";
    lobby.questionIndex = 0;
    lobby.chatLog = [];
    lobby.questionOrder = shuffle([...Array(QUESTIONS.length).keys()]).slice(0, 30);

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
      if (lobby.questionIndex >= 30) {
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
      if (lobby.questionIndex >= 30) {
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
