const content = {
  name: "Anton Leoman",
  firstName: "Anton",

  // --- Start screen (neutral — looks like just a golf game) ---
  intro: {
    kicker: "⛳ TEE TIME",
    title: "Office Mini Golf",
    subtitle: "Satu hole, satu tantangan. Masukkan bolanya — gampang, kan?",
    cta: "Mulai Main",
  },

  // --- The game: real physics golf. The win is guaranteed via a hidden assist
  // that widens the cup after each miss (see src/game/physics.js). ---
  game: {
    hint: "Tarik bolanya ke belakang, lalu lepas untuk memukul. Awas anginnya! ⛳",
    windLabel: "Angin",
    missText: "Yaah, meleset tipis! 😅",
    tapToRetry: "Ketuk untuk coba lagi 🔁",
    retryCta: "Coba Lagi 🔁",
    sinkText: "MASUK! HOLE IN ONE! 🎉",
  },

  // --- Reveal ---
  reveal: {
    teaser: "Eh tapi… ini bukan cuma soal golf. 🎂",
    title: "Happy Birthday, Anton! 🎉",
  },

  message:
    "Wishing you a fantastic birthday, Anton! Thank you for everything you bring to the team. Here's to a year full of wins, laughter, and good coffee. 🎂",
  photo: "/anton.jpg", // placeholder — replace file in public/
  music: "/birthday.mp3", // placeholder — replace file in public/
};

export default content;
