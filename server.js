const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// ─── App Setup ───────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.static(`${__dirname}/public`));
app.get("/", (_req, res) => res.sendFile(`${__dirname}/views/index.html`));

// ─── Config & Constants ──────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const SKIP_KEYWORD = process.env.SKIPPING;
const CHRONO_KEYWORD = "ChronoStart123";
const POINTS_PER_CORRECT = 10;
const MAX_QUESTIONS = 30;

/** @type {{ name: string, imageUrl: string }[]} */
const PLAYER_IDENTITIES = [
  {
    name: process.env.PLAYER1,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png",
  },
  {
    name: process.env.PLAYER2,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png",
  },
  {
    name: process.env.PLAYER3,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png",
  },
  {
    name: process.env.PLAYER4,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png",
  },
  {
    name: process.env.PLAYER5,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/5/53/Scooby-Doo.png",
  },
];

/** @type {{ question: string, numero: string }[]} */
const QUESTIONS = [
  { question: "Comment allez vous ?",                                                                                   numero: "Question n°1/30"  },
  { question: "Quel est votre jeu vidéo préféré ?",                                                                    numero: "Question n°2/30"  },
  { question: "Quel est la dernière chanson que vous avez écouté ?",                                                    numero: "Question n°3/30"  },
  { question: "Que mangez vous généralement le matin au petit déjeuner ?",                                              numero: "Question n°4/30"  },
  { question: "Un bébé pleure dans votre train depuis 4 heures, comment réagiriez vous ?",                              numero: "Question n°5/30"  },
  { question: "Quel est votre dernière commande Uber Eats ?",                                                           numero: "Question n°6/30"  },
  { question: "Si vous pouviez virer un mec du vocal de manière permanente, lequel serait-ce ?",                        numero: "Question n°7/30"  },
  { question: "Fantasmez-vous sur les naines ?",                                                                        numero: "Question n°8/30"  },
  { question: "Est-ce que vous vous trouvez objectivement beau ?",                                                      numero: "Question n°9/30"  },
  { question: "Selon vous, qui est la plus grosse fraude sur Twitch ?",                                                 numero: "Question n°10/30" },
  { question: "Quel est la plus grosse célébrité que vous ayez croisé dans votre vie ?",                                numero: "Question n°11/30" },
  { question: "Marque de vêtement que vous préférez porter ?",                                                          numero: "Question n°12/30" },
  { question: "Quel accent vous fait le plus rire ?",                                                                   numero: "Question n°13/30" },
  { question: "Destination de rêve ?",                                                                                  numero: "Question n°14/30" },
  { question: "Vous prenez quel streameur à la bagarre ?",                                                              numero: "Question n°15/30" },
  { question: "La dernière fois que vous avez pleuré, c'était pour quoi ?",                                             numero: "Question n°16/30" },
  { question: "Quel est le nom de votre animal de compagnie ?",                                                         numero: "Question n°17/30" },
  { question: "Pour combien accepteriez-vous de porter des vêtements pourris (unicorn, unkut, etc..) ?",                numero: "Question n°18/30" },
  { question: "L'âge de votre première branlette, juste pour savoir ^^ ?",                                             numero: "Question n°19/30" },
  { question: "Quel est l'objet de plus grosse valeur que vous ayez volé ?",                                            numero: "Question n°20/30" },
  { question: "Quel adjectif qualifie le mieux Quentin pour vous ?",                                                    numero: "Question n°21/30" },
  { question: "Dites moi votre fantasme sexuel irréalisable ?",                                                         numero: "Question n°22/30" },
  { question: "FLASH : Mathieu est mort d'une crise cardiaque !! Votre idée de costume à l'enterrement ?",              numero: "Question n°23/30" },
  { question: "Quel rôle de cinéma est le mieux fait pour vous et pourquoi : James bond ou Scott Pilgrim ?",            numero: "Question n°24/30" },
  { question: "Quel est la première chose que vous regardez chez une femme ?",                                          numero: "Question n°25/30" },
  { question: "Quand vous étiez gosse, quel était le métier de vos rêves ?",                                            numero: "Question n°26/30" },
  { question: "On vous annonce que Clément à pris de la prison ferme, pour quel motif selon vous",                      numero: "Question n°27/30" },
  { question: "Votre plus gros défaut physique ?",                                                                      numero: "Question n°28/30" },
  { question: "Le pire endroit où vous avez chié ?",                                                                    numero: "Question n°29/30" },
  { question: "Quel est votre don maximum au Zevent ?",                                                                 numero: "Question n°30/30" },
  { question: "C'est fini ! Préparez-vous à relier les fausses identités aux vraies !", numero: "Demutez vous" },
];

// ─── Game State ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Player
 * @property {string}  id       - Socket ID
 * @property {string}  name     - Real username
 * @property {string}  pseudo   - Assigned fake identity name
 * @property {string}  imageUrl - Assigned fake identity image
 * @property {number}  points   - Score
 * @property {Object.<string, string>} answers - Keyed answers per question index
 */

/** @type {Map<string, Player>} */
const players = new Map(); // socket.id → Player

let currentQuestion = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return a random integer in [min, max] inclusive. */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a fake identity not yet assigned to any connected player.
 * Retries up to identities.length times before giving up (returns first).
 * @returns {{ name: string, imageUrl: string }}
 */
function pickUniqueIdentity() {
  const usedNames = new Set([...players.values()].map((p) => p.pseudo));
  const available = PLAYER_IDENTITIES.filter((id) => !usedNames.has(id.name));
  const pool = available.length > 0 ? available : PLAYER_IDENTITIES;
  return pool[randomInt(0, pool.length - 1)];
}

/** Emit the current waiting-room player list. */
function broadcastLobby() {
  io.emit(
    "update_Attente",
    [...players.values()].map((p) => p.name)
  );
}

/** Emit the current question and the list of pseudo + images. */
function broadcastCurrentQuestion() {
  if (currentQuestion >= MAX_QUESTIONS) {
    startMatchingPhase();
    return;
  }

  io.emit("send_question", QUESTIONS[currentQuestion]);

  const pseudos = [...players.values()].map((p) => p.pseudo);
  const images  = [...players.values()].map((p) => p.imageUrl);
  io.emit("update_players", pseudos, images);
}

/** Reset chat + push current game state to everyone. */
function resetAndBroadcast() {
  io.emit("delete_chat", "");
  broadcastCurrentQuestion();
}

/** Emit the matching phase data (real names ↔ pseudos). */
function startMatchingPhase() {
  const names   = [...players.values()].map((p) => p.name);
  const pseudos = [...players.values()].map((p) => p.pseudo);
  io.emit("debutRelier", names, pseudos);
}

/**
 * Record a player's answer for the current question.
 * Advances the question counter when everyone has answered.
 */
function recordAnswer(playerName, answer) {
  for (const player of players.values()) {
    if (player.name === playerName) {
      player.answers[currentQuestion] = answer;
      break;
    }
  }

  const allAnswered = [...players.values()].every(
    (p) => p.answers[currentQuestion] !== undefined
  );

  if (allAnswered) {
    currentQuestion += 1;
    broadcastCurrentQuestion();
  }
}

/**
 * Score a player's matching-phase submissions.
 * Each correct name ↔ pseudo pair is worth POINTS_PER_CORRECT points.
 * @param {string} socketId
 * @param {string[]} guesses - Ordered guesses, one per player slot
 */
function scoreMatchingAnswers(socketId, guesses) {
  const playerList = [...players.values()];
  const guesser = players.get(socketId);
  if (!guesser) return;

  for (let i = 0; i < playerList.length; i++) {
    if (guesses[i] === playerList[i].name) {
      guesser.points += POINTS_PER_CORRECT;
    }
  }
}

/** Return the top-10 leaderboard, sorted by score descending. */
function leaderboard() {
  return [...players.values()]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map(({ name, pseudo, points }) => ({ name, pseudo, points }));
}

// ─── Socket Events ───────────────────────────────────────────────────────────

io.on("connection", (socket) => {
  // ── Join ──────────────────────────────────────────────────────────────────
  socket.on("user_join", (name) => {
    const identity = pickUniqueIdentity();

    /** @type {Player} */
    const player = {
      id:       socket.id,
      name,
      pseudo:   identity.name,
      imageUrl: identity.imageUrl,
      points:   0,
      answers:  {},
    };

    players.set(socket.id, player);
    console.log(`[JOIN] ${name} (${socket.id})`);

    socket.emit("pseudo_joueur", player.pseudo);
    broadcastLobby();
  });

  // ── Answer ────────────────────────────────────────────────────────────────
  socket.on("send_response", (name, response) => {
    if (response !== CHRONO_KEYWORD) {
      recordAnswer(name, response);
    }
  });

  // ── Private Message ───────────────────────────────────────────────────────
  socket.on("messagePrivate", (senderPseudo, recipientPseudo, message) => {
    io.emit("MessagePriveEnvoi", recipientPseudo, senderPseudo, message);
    io.emit("updateNotif", senderPseudo, recipientPseudo);
  });

  // ── View a Specific Player's Answers ──────────────────────────────────────
  socket.on("voirReponsesJoueur", (slotKey, requesterName) => {
    // slotKey is "joueur1"…"joueur5"
    const index = parseInt(slotKey.replace("joueur", ""), 10) - 1;
    const playerList = [...players.values()];

    if (index < 0 || index >= playerList.length) return;

    const target = playerList[index];
    const questions = QUESTIONS.slice(0, MAX_QUESTIONS).map((q) => q.question);
    const answers   = questions.map((_, i) => target.answers[i] ?? "");

    io.emit("AfficherReponsesJoueur", questions, answers, requesterName);
  });

  // ── Final Reveal ──────────────────────────────────────────────────────────
  socket.on("reponse_afficher_final", () => {
    const names   = [...players.values()].map((p) => p.name);
    const pseudos = [...players.values()].map((p) => p.pseudo);
    const images  = [...players.values()].map((p) => p.imageUrl);
    io.emit("reponse_afficher_final_All", names, pseudos, images);
  });

  // ── Chat / Skip ───────────────────────────────────────────────────────────
  socket.on("user_message", (pseudo, message) => {
    if (message === SKIP_KEYWORD) {
      startMatchingPhase();
    } else {
      io.emit("updateNewMessage", pseudo, message);
    }
  });

  // ── Clear / Reset ─────────────────────────────────────────────────────────
  socket.on("delete_message", () => resetAndBroadcast());

  // ── Start Game ────────────────────────────────────────────────────────────
  socket.on("CommencerJeu", () => {
    currentQuestion = 0;
    io.emit("StartGame", "lancer le jeu");
    resetAndBroadcast();
  });

  // ── Leaderboard ───────────────────────────────────────────────────────────
  socket.on("VoirPoints", () => {
    io.emit("AfficherPoints", leaderboard());
  });

  // ── Matching Phase Submission ─────────────────────────────────────────────
  socket.on("reponse_relier", (name, guesses) => {
    scoreMatchingAnswers(socket.id, guesses);
    // Optionally notify the client their answers were recorded
    socket.emit("reponse_relier_ack");
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`[LEAVE] ${player.name} (${socket.id})`);
      players.delete(socket.id);
      resetAndBroadcast();
    }
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => console.log(`Listening on port ${PORT}`));