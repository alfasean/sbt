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

  // --- The game. Shot 1 is a scripted miss, shot 2 a scripted hole-in-one ---
  game: {
    hint: "Tahan untuk isi tenaga, lepas untuk memukul.",
    missText: "Yaah, meleset tipis! 😅",
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
