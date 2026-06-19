let currentTemperature = null;
let currentHumidity = null;
let currentUvIndex = null;

function updateCatMessage(message) {
  const catMessage = document.getElementById("catMessage");
  if (catMessage) catMessage.innerText = `🐱 ${message}`;
}

function showRandomCat() {
  const cats = [
    "cats/cat1.jpg",
    "cats/cat2.jpg",
    "cats/cat3.jpg",
    "cats/cat4.jpg",
    "cats/cat5.jpg"
  ];

  const catImage = document.getElementById("dailyCat");
  if (!catImage) return;

  catImage.src = cats[Math.floor(Math.random() * cats.length)];
  catImage.style.display = "block";
}

function getWeather() {
  if (!navigator.geolocation) {
    document.getElementById("location").innerText = "📍 Geolocalizzazione non supportata.";
    updateCatMessage("Non riesco a vedere il meteo, ma possiamo comunque fare il check-in.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);
}

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  document.getElementById("location").innerText = "📍 Posizione rilevata";

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index` +
    `&timezone=auto`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      currentTemperature = data.current.temperature_2m;
      currentHumidity = data.current.relative_humidity_2m;
      currentUvIndex = data.current.uv_index;

      const wind = data.current.wind_speed_10m;

      document.getElementById("temperature").innerText =
        `🌡️ Temperatura: ${currentTemperature}°C | Umidità: ${currentHumidity}% | Vento: ${wind} km/h`;

      document.getElementById("uvIndex").innerText =
        `☀️ Indice UV: ${currentUvIndex}`;

      document.getElementById("weatherAdvice").innerText =
        createWeatherAdvice(currentTemperature, currentHumidity);

      document.getElementById("sunAdvice").innerText =
        createSunAdvice(currentUvIndex);

      if (currentTemperature >= 30) {
        updateCatMessage("Oggi fa caldo. Prima acqua, poi ansia.");
      } else if (currentUvIndex >= 8) {
        updateCatMessage("Oggi il sole picchia forte. Crema prima di uscire.");
      } else {
        updateCatMessage("Oggi sembra gestibile. Partiamo piano.");
      }
    })
    .catch(() => {
      document.getElementById("weatherAdvice").innerText =
        "Non riesco a recuperare il meteo adesso.";
      updateCatMessage("Il meteo non si carica, ma il check-in possiamo farlo lo stesso.");
    });
}

function error() {
  document.getElementById("location").innerText = "📍 Posizione non autorizzata.";
  document.getElementById("weatherAdvice").innerText =
    "Attiva la posizione per ricevere consigli basati sul meteo reale.";
  updateCatMessage("Senza posizione non posso leggere il meteo, ma posso comunque aiutarti a capire come stai.");
}

function createWeatherAdvice(temp, humidity) {
  if (temp >= 30 && humidity >= 60) {
    return "Oggi caldo e umidità possono pesare molto sul corpo: vestiti leggerissima, bevi spesso e non saltare i pasti.";
  }

  if (temp >= 30) {
    return "Oggi fa caldo: vestiti leggera, bevi almeno 2,5 L d'acqua e integra sali minerali.";
  }

  if (temp >= 24) {
    return "Oggi è caldo ma gestibile: vestiti leggera e porta acqua con te.";
  }

  if (temp <= 10) {
    return "Oggi fa freddo: vestiti a strati e copriti bene.";
  }

  return "Oggi la temperatura è moderata: vestiti comoda e ascolta il tuo livello di energia.";
}

function createSunAdvice(uv) {
  if (uv === null || uv === undefined) {
    return "☀️ Non riesco a leggere l'indice UV.";
  }

  if (uv <= 2) {
    return "🧴 UV basso: SPF facoltativo se stai poco fuori, ma meglio usarlo comunque sul viso.";
  }

  if (uv <= 5) {
    return "🧴 UV moderato: SPF 30 consigliato. Se stai all'aperto, riapplica ogni 3-4 ore.";
  }

  if (uv <= 7) {
    return "🧴 UV alto: SPF 50 consigliato. Riapplica ogni 2 ore se sei all'aperto.";
  }

  if (uv <= 10) {
    return "🧴 UV molto alto: SPF 50+. Riapplica ogni 2 ore, evita sole diretto tra 12 e 16.";
  }

  return "🧴 UV estremo: SPF 50+ obbligatorio. Riapplica ogni 90 minuti se sei fuori ed evita esposizione diretta.";
}

function calculateSleepHours(sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return null;

  const [sleepH, sleepM] = sleepTime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);

  let sleepMinutes = sleepH * 60 + sleepM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes <= sleepMinutes) wakeMinutes += 24 * 60;

  return Math.round(((wakeMinutes - sleepMinutes) / 60) * 10) / 10;
}

function calculateCyclePhase(lastPeriodDate, cycleLength, periodLength) {
  if (!lastPeriodDate) return "non_specificato";

  const start = new Date(lastPeriodDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "non_specificato";

  const cycleDay = (diffDays % cycleLength) + 1;

  if (cycleDay <= periodLength) return "mestruazione";

  const ovulationDay = Math.round(cycleLength - 14);

  if (cycleDay < ovulationDay - 4) return "follicolare_iniziale";
  if (cycleDay < ovulationDay - 1) return "follicolare_avanzata";
  if (cycleDay <= ovulationDay + 1) return "ovulazione";
  if (cycleDay < cycleLength - 5) return "luteale_iniziale";

  return "luteale_avanzata";
}

function getCycleAdvice(phase) {
  const advice = {
    non_specificato: {
      body: "Non hai inserito dati sufficienti per calcolare la fase del ciclo.",
      food: ["pasti regolari", "proteine leggere", "frutta e verdura"],
      drinks: ["acqua regolare", "tisana se ti rilassa"]
    },
    mestruazione: {
      body: "Durante la mestruazione è normale avere meno energia, più pesantezza e più bisogno di riposo.",
      food: ["ferro: lenticchie, spinaci, carne rossa se la mangi", "magnesio: cacao amaro, mandorle", "proteine leggere"],
      drinks: ["2 L di acqua", "tisana zenzero", "tisana camomilla se hai crampi"]
    },
    follicolare_iniziale: {
      body: "Nella fase follicolare iniziale il corpo può ripartire gradualmente: non serve forzare subito.",
      food: ["uova o yogurt", "cereali integrali", "verdure fresche"],
      drinks: ["acqua", "tè verde se lo tolleri"]
    },
    follicolare_avanzata: {
      body: "Nella fase follicolare avanzata potresti avere più energia e lucidità.",
      food: ["proteine", "carboidrati complessi", "frutta fresca"],
      drinks: ["2 L acqua", "acqua con limone se ti piace"]
    },
    ovulazione: {
      body: "In ovulazione alcune persone si sentono più energiche, altre più sensibili o gonfie.",
      food: ["verdure crucifere: broccoli, cavolfiore", "pesce o legumi", "frutta ricca di acqua"],
      drinks: ["acqua", "tisana finocchio se hai gonfiore"]
    },
    luteale_iniziale: {
      body: "Nella fase luteale iniziale può aumentare il bisogno di stabilità: pasti regolari aiutano.",
      food: ["carboidrati complessi", "proteine", "frutta secca"],
      drinks: ["acqua regolare", "tisane leggere"]
    },
    luteale_avanzata: {
      body: "Nella fase luteale avanzata/PMS è normale sentirsi più irritabile, gonfia, affamata o vulnerabile.",
      food: ["magnesio: mandorle, cacao amaro, banane", "potassio: banana, patate, avocado", "riduci sale e alcol se ti gonfiano"],
      drinks: ["2-2,5 L acqua", "tisana finocchio", "tisana zenzero"]
    },
    nessun_sintomo: {
      body: "Oggi non segnali sintomi particolari legati al ciclo.",
      food: ["pasti bilanciati", "proteine", "verdure"],
      drinks: ["2 L acqua"]
    }
  };

  return advice[phase] || advice.non_specificato;
}

function formatCycle(phase) {
  const labels = {
    non_specificato: "Non specificato",
    mestruazione: "Mestruazione",
    follicolare_iniziale: "Fase follicolare iniziale",
    follicolare_avanzata: "Fase follicolare avanzata",
    ovulazione: "Ovulazione",
    luteale_iniziale: "Fase luteale iniziale",
    luteale_avanzata: "Fase luteale avanzata / PMS",
    nessun_sintomo: "Nessun sintomo particolare"
  };

  return labels[phase] || "Non specificato";
}

function calculateDayScore({ sleepHours, nightWakeups, mood, energy, cyclePhase }) {
  let score = 0;
  let reasons = [];

  if (sleepHours !== null && sleepHours < 6) {
    score += 2;
    reasons.push("sonno basso");
  } else if (sleepHours !== null && sleepHours < 7) {
    score += 1;
    reasons.push("sonno non pieno");
  }

  if (nightWakeups === "Più volte") {
    score += 1;
    reasons.push("risvegli notturni");
  }

  if (currentTemperature !== null && currentTemperature >= 30) {
    score += 2;
    reasons.push("caldo forte");
  }

  if (currentHumidity !== null && currentHumidity >= 65) {
    score += 1;
    reasons.push("umidità alta");
  }

  if (currentUvIndex !== null && currentUvIndex >= 8) {
    score += 1;
    reasons.push("UV molto alto");
  }

  if (energy <= 3) {
    score += 2;
    reasons.push("energia bassa");
  } else if (energy <= 5) {
    score += 1;
    reasons.push("energia media");
  }

  if (mood === "Male") {
    score += 2;
    reasons.push("umore basso");
  } else if (mood === "Così così") {
    score += 1;
    reasons.push("umore instabile");
  }

  if (cyclePhase === "mestruazione" || cyclePhase === "luteale_avanzata") {
    score += 1;
    reasons.push("fase del ciclo più delicata");
  }

  if (score <= 2) {
    return {
      label: "🟢 Giornata favorevole",
      text: "Oggi i dati non indicano una giornata particolarmente pesante.",
      reasons
    };
  }

  if (score <= 5) {
    return {
      label: "🟡 Giornata delicata",
      text: "Oggi ci sono alcuni fattori che potrebbero renderti più sensibile.",
      reasons
    };
  }

  return {
    label: "🔴 Giornata di protezione",
    text: "Oggi diversi fattori possono pesare insieme. Proteggi energia, corpo e lucidità.",
    reasons
  };
}

function analyzeAnxiety(text) {
  const lower = text.toLowerCase();

  if (lower.includes("svenire") || lower.includes("malore") || lower.includes("stare male")) {
    return {
      facts: "Caldo, poco sonno, ciclo e poca idratazione possono amplificare le sensazioni fisiche.",
      hypothesis: "Che starai sicuramente male.",
      reminder: "Una sensazione fisica non è automaticamente un segnale di pericolo."
    };
  }

  if (lower.includes("lavoro") || lower.includes("capo") || lower.includes("collega")) {
    return {
      facts: "Hai una preoccupazione legata al lavoro.",
      hypothesis: "Che gli altri stiano pensando qualcosa di negativo su di te.",
      reminder: "Finché non hai una prova concreta, trattala come un'ipotesi."
    };
  }

  return {
    facts: "Hai scritto una preoccupazione reale per te in questo momento.",
    hypothesis: "Che questa preoccupazione diventi automaticamente realtà.",
    reminder: "Una preoccupazione è un pensiero, non una previsione."
  };
}

function generateReport() {
  const sleepTime = document.getElementById("sleepTime").value;
  const wakeTime = document.getElementById("wakeTime").value;
  const nightWakeups = document.getElementById("nightWakeups").value;
  const mood = document.getElementById("mood").value;
  const energy = Number(document.getElementById("energy").value);
  const anxiety = document.getElementById("anxiety").value.trim();

  const lastPeriodDate = document.getElementById("lastPeriodDate").value;
  const cycleLength = Number(document.getElementById("cycleLength").value) || 28;
  const periodLength = Number(document.getElementById("periodLength").value) || 5;

  const cyclePhase = calculateCyclePhase(lastPeriodDate, cycleLength, periodLength);
  const cycleAdvice = getCycleAdvice(cyclePhase);

  const sleepHours = calculateSleepHours(sleepTime, wakeTime);
  const dayScore = calculateDayScore({ sleepHours, nightWakeups, mood, energy, cyclePhase });

  if (dayScore.label.includes("🔴")) {
    updateCatMessage("Oggi non devi dimostrare niente. Devi solo proteggerti.");
  } else if (dayScore.label.includes("🟡")) {
    updateCatMessage("Oggi vai con calma. Una cosa alla volta.");
  } else {
    updateCatMessage("Oggi hai una buona base. Non sprecarla caricandoti troppo.");
  }

  let dayContext = "";
  let needs = [];

  if (sleepHours !== null) {
    dayContext += `Hai dormito circa ${sleepHours} ore. `;
  }

  if (nightWakeups === "Più volte") {
    dayContext += "Ti sei svegliata più volte, quindi potresti sentirti poco riposata. ";
    needs.push("fare pause brevi durante la giornata");
  }

  if (currentTemperature !== null && currentTemperature >= 30) {
    dayContext += "Il caldo può aumentare stanchezza, debolezza e agitazione fisica. ";
    needs.push("bere almeno 2,5 L d'acqua");
  }

  if (currentUvIndex !== null && currentUvIndex >= 6) {
    needs.push("mettere crema solare prima di uscire");
  }

  if (cycleAdvice.body) {
    dayContext += cycleAdvice.body + " ";
  }

  if (energy <= 3) {
    needs.push("fare solo le cose essenziali");
  }

  if (needs.length === 0) {
    needs.push("mantenere una routine semplice");
    needs.push("bere acqua con regolarità");
    needs.push("mangiare in modo stabile");
  }

  const needsList = needs.slice(0, 3).map(item => `<li>${item}</li>`).join("");
  const reasonsText = dayScore.reasons.length > 0 ? dayScore.reasons.join(", ") : "nessun fattore critico evidente";

  let anxietyBlock = "";
  if (anxiety !== "") {
    const anxietyAnalysis = analyzeAnxiety(anxiety);
    anxietyBlock = `
      <h3>La tua preoccupazione</h3>
      <p><strong>Hai scritto:</strong> ${anxiety}</p>
      <p><strong>Fatto:</strong> ${anxietyAnalysis.facts}</p>
      <p><strong>Ipotesi:</strong> ${anxietyAnalysis.hypothesis}</p>
      <p><strong>Promemoria:</strong> ${anxietyAnalysis.reminder}</p>
    `;
  }

  document.getElementById("reportText").innerHTML = `
    <h3>Indice giornata</h3>
    <p><strong>${dayScore.label}</strong></p>
    <p>${dayScore.text}</p>
    <p><strong>Fattori considerati:</strong> ${reasonsText}.</p>

    <h3>Come potrebbe influenzarti la giornata</h3>
    <p>${dayContext || "Oggi non emergono segnali particolarmente pesanti dai dati inseriti."}</p>

    <h3>Protezione solare</h3>
    <p>${createSunAdvice(currentUvIndex)}</p>

    <h3>Fase del ciclo calcolata</h3>
    <p><strong>${formatCycle(cyclePhase)}</strong></p>
    <p>${cycleAdvice.body}</p>

    <h3>Cosa mangiare oggi</h3>
    <ul>${cycleAdvice.food.map(item => `<li>${item}</li>`).join("")}</ul>

    <h3>Cosa bere oggi</h3>
    <ul>${cycleAdvice.drinks.map(item => `<li>${item}</li>`).join("")}</ul>

    <h3>Cosa ti serve oggi</h3>
    <ul>${needsList}</ul>

    ${anxietyBlock}

    <h3>Obiettivo del giorno</h3>
    <p>${energy <= 4 || mood === "Male"
      ? "Oggi il tuo obiettivo non è performare. È arrivare a sera stabile."
      : "Oggi il tuo obiettivo è mantenere equilibrio senza caricarti troppo."}</p>
  `;

  document.getElementById("reportCard").style.display = "block";

  saveCheckIn({
    date: new Date().toLocaleDateString("it-IT"),
    time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    temperature: currentTemperature,
    humidity: currentHumidity,
    uvIndex: currentUvIndex,
    sleepHours,
    nightWakeups,
    mood,
    energy,
    cyclePhase,
    lastPeriodDate,
    cycleLength,
    periodLength,
    anxiety,
    dayScore: dayScore.label
  });
}

function saveCheckIn(data) {
  const checkins = JSON.parse(localStorage.getItem("dailyEvaCheckins")) || [];
  checkins.push(data);
  localStorage.setItem("dailyEvaCheckins", JSON.stringify(checkins));
  showHistory();
  showInsights();
}

function saveEveningCheckOut() {
  const outcome = document.getElementById("eveningOutcome").value;
  const note = document.getElementById("eveningNote").value.trim();

  if (!outcome) {
    alert("Seleziona se la preoccupazione si è verificata oppure no.");
    return;
  }

  const checkins = JSON.parse(localStorage.getItem("dailyEvaCheckins")) || [];

  if (checkins.length === 0) {
    alert("Non c'è ancora un check-in del mattino da aggiornare.");
    return;
  }

  const lastIndex = checkins.length - 1;
  checkins[lastIndex].eveningOutcome = outcome;
  checkins[lastIndex].eveningNote = note;
  checkins[lastIndex].eveningDate = new Date().toLocaleDateString("it-IT");

  localStorage.setItem("dailyEvaCheckins", JSON.stringify(checkins));

  alert("Check-out serale salvato.");

  document.getElementById("eveningOutcome").value = "";
  document.getElementById("eveningNote").value = "";

  showHistory();
  showInsights();
}

function showHistory() {
  const checkins = JSON.parse(localStorage.getItem("dailyEvaCheckins")) || [];
  const historyCard = document.getElementById("historyCard");

  if (!historyCard || checkins.length === 0) return;

  let historyHTML = "<h2>Storico check-in</h2>";

  checkins.slice(-5).reverse().forEach(item => {
    const outcomeText =
      item.eveningOutcome === "no" ? "No" :
      item.eveningOutcome === "partly" ? "In parte" :
      item.eveningOutcome === "yes" ? "Sì" :
      "Non compilato";

    historyHTML += `
      <div class="mini-card">
        <p><strong>${item.date} - ${item.time || ""}</strong></p>
        <p>Indice: ${item.dayScore || "--"}</p>
        <p>Sonno: ${item.sleepHours ?? "--"} ore</p>
        <p>Energia: ${item.energy}/10</p>
        <p>Umore: ${item.mood}</p>
        <p>Ciclo: ${formatCycle(item.cyclePhase)}</p>
        <p>UV: ${item.uvIndex ?? "--"}</p>
        <p>Check-out serale: ${outcomeText}</p>
      </div>
    `;
  });

  historyCard.innerHTML = historyHTML;
  historyCard.style.display = "block";
}

function showInsights() {
  const checkins = JSON.parse(localStorage.getItem("dailyEvaCheckins")) || [];
  const insightsCard = document.getElementById("insightsCard");

  if (!insightsCard) return;

  if (checkins.length < 3) {
    insightsCard.innerHTML = `
      <h2>Cosa sto imparando su Eva</h2>
      <p>Mi servono almeno 3 check-in per iniziare a notare dei pattern.</p>
    `;
    insightsCard.style.display = "block";
    return;
  }

  const lastCheckins = checkins.slice(-14);
  const averageEnergy =
    lastCheckins.reduce((sum, item) => sum + Number(item.energy || 0), 0) / lastCheckins.length;

  const anxietyDays = lastCheckins.filter(item => item.anxiety && item.anxiety.length > 0);
  const highUvDays = lastCheckins.filter(item => item.uvIndex !== null && item.uvIndex >= 6);
  const cycleDays = lastCheckins.filter(item =>
    item.cyclePhase &&
    item.cyclePhase !== "non_specificato" &&
    item.cyclePhase !== "nessun_sintomo"
  );

  let insights = [];

  if (anxietyDays.length > 0) {
    insights.push(`Hai scritto una preoccupazione in ${anxietyDays.length} check-in su ${lastCheckins.length}.`);
  }

  if (highUvDays.length > 0) {
    insights.push(`Negli ultimi check-in ci sono stati ${highUvDays.length} giorni con UV alto: la protezione solare è importante.`);
  }

  if (cycleDays.length >= 2) {
    const cycleEnergy = cycleDays.reduce((sum, item) => sum + Number(item.energy || 0), 0) / cycleDays.length;
    insights.push(`Nei giorni collegati al ciclo, la tua energia media è ${cycleEnergy.toFixed(1)}/10.`);
  }

  const resolvedEveningChecks = lastCheckins.filter(item => item.eveningOutcome);
  const notHappened = resolvedEveningChecks.filter(item => item.eveningOutcome === "no");

  if (resolvedEveningChecks.length > 0) {
    const percentage = Math.round((notHappened.length / resolvedEveningChecks.length) * 100);
    insights.push(`Nel ${percentage}% dei check-out serali, la preoccupazione del mattino non si è verificata.`);
  }

  insights.push(`La tua energia media recente è ${averageEnergy.toFixed(1)}/10.`);

  insightsCard.innerHTML = `
    <h2>Cosa sto imparando su Eva</h2>
    <ul>${insights.map(item => `<li>${item}</li>`).join("")}</ul>
  `;

  insightsCard.style.display = "block";
}

getWeather();
showHistory();
showInsights();
showRandomCat();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
