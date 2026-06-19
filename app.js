let currentTemperature = null;
let currentHumidity = null;

function updateCatMessage(message) {
  const catMessage = document.getElementById("catMessage");
  if (catMessage) {
    catMessage.innerText = `🐱 ${message}`;
  }
}

function showRandomCat() {
  const cats = [
    "cats/cat1.jpg",
    "cats/cat2.jpg",
    "cats/cat3.jpg",
    "cats/cat4.jpg",
    "cats/cat5.jpg"
  ];

  const randomCat = cats[Math.floor(Math.random() * cats.length)];
  const catImage = document.getElementById("dailyCat");

  if (!catImage) return;

  catImage.src = randomCat;
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

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      currentTemperature = data.current.temperature_2m;
      currentHumidity = data.current.relative_humidity_2m;
      const wind = data.current.wind_speed_10m;

      document.getElementById("temperature").innerText =
        `🌡️ Temperatura: ${currentTemperature}°C | Umidità: ${currentHumidity}% | Vento: ${wind} km/h`;

      document.getElementById("weatherAdvice").innerText =
        createWeatherAdvice(currentTemperature, currentHumidity);

      if (currentTemperature >= 30) {
        updateCatMessage("Oggi fa caldo. Prima acqua, poi ansia.");
      } else if (currentTemperature <= 10) {
        updateCatMessage("Oggi copriti bene. Il corpo va tenuto al sicuro.");
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

function calculateSleepHours(sleepTime, wakeTime) {
  if (!sleepTime || !wakeTime) return null;

  const [sleepH, sleepM] = sleepTime.split(":").map(Number);
  const [wakeH, wakeM] = wakeTime.split(":").map(Number);

  let sleepMinutes = sleepH * 60 + sleepM;
  let wakeMinutes = wakeH * 60 + wakeM;

  if (wakeMinutes <= sleepMinutes) {
    wakeMinutes += 24 * 60;
  }

  return Math.round(((wakeMinutes - sleepMinutes) / 60) * 10) / 10;
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

  if (cyclePhase === "pre_ciclo" || cyclePhase === "ciclo") {
    score += 1;
    reasons.push("fase del ciclo più delicata");
  }

  if (score <= 2) {
    return {
      label: "🟢 Giornata favorevole",
      text: "Oggi i dati non indicano una giornata particolarmente pesante. Mantieni una routine semplice e non caricarti inutilmente.",
      reasons
    };
  }

  if (score <= 5) {
    return {
      label: "🟡 Giornata delicata",
      text: "Oggi ci sono alcuni fattori che potrebbero renderti più sensibile. Non è una giornata negativa: è una giornata da gestire con più attenzione.",
      reasons
    };
  }

  return {
    label: "🔴 Giornata di protezione",
    text: "Oggi diversi fattori possono pesare insieme. L'obiettivo non è fare tutto, ma proteggere energia, corpo e lucidità.",
    reasons
  };
}

function getCycleText(phase) {
  if (phase === "pre_ciclo") {
    return "Se sei nella fase pre-ciclo, è possibile sentirti più sensibile, irritabile o fisicamente vulnerabile. Non significa che stai andando peggio: potrebbe essere una fase più delicata.";
  }

  if (phase === "ciclo") {
    return "Durante il ciclo potresti avere meno energia, più pesantezza fisica o più bisogno di riposo. Oggi ha senso alleggerire le aspettative.";
  }

  if (phase === "ovulazione") {
    return "In ovulazione alcune persone si sentono più energiche, altre più sensibili. Osserva come risponde il tuo corpo senza forzarti.";
  }

  if (phase === "post_ciclo") {
    return "Dopo il ciclo potresti sentirti gradualmente più stabile. Se oggi non è così, non forzare: guarda anche sonno, caldo e stress.";
  }

  return "";
}

function analyzeAnxiety(text) {
  const lower = text.toLowerCase();

  if (lower.includes("svenire") || lower.includes("malore") || lower.includes("stare male")) {
    return {
      facts: "Potresti sentirti più sensibile se hai dormito poco, fa caldo, sei nel periodo del ciclo o hai bevuto poco.",
      hypothesis: "Che starai sicuramente male.",
      reminder: "Una sensazione fisica non è automaticamente un segnale di pericolo."
    };
  }

  if (lower.includes("lavoro") || lower.includes("capo") || lower.includes("collega")) {
    return {
      facts: "Hai una preoccupazione legata al lavoro.",
      hypothesis: "Che gli altri stiano pensando qualcosa di negativo su di te.",
      reminder: "Finché non hai una prova concreta, trattala come un'ipotesi, non come un fatto."
    };
  }

  if (lower.includes("dormire") || lower.includes("sonno") || lower.includes("insonnia")) {
    return {
      facts: "Hai paura di non dormire o di dormire male.",
      hypothesis: "Che una notte difficile rovinerà tutta la giornata.",
      reminder: "Dormire male è fastidioso, ma non significa automaticamente che domani andrà male."
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
  const cyclePhase = document.getElementById("cyclePhase").value;
  const anxiety = document.getElementById("anxiety").value.trim();

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
    if (sleepHours < 6) {
      dayContext += `Hai dormito circa ${sleepHours} ore: oggi potresti sentirti più fragile, stanca o irritabile. `;
      needs.push("non pretendere troppo da te stessa");
    } else if (sleepHours < 7) {
      dayContext += `Hai dormito circa ${sleepHours} ore: potresti non sentirti al massimo. `;
    } else {
      dayContext += `Hai dormito circa ${sleepHours} ore: il sonno oggi sembra abbastanza stabile. `;
    }
  }

  if (nightWakeups === "Più volte") {
    dayContext += "Ti sei svegliata più volte, quindi potresti sentirti poco riposata. ";
    needs.push("fare pause brevi durante la giornata");
  }

  if (currentTemperature !== null && currentTemperature >= 30) {
    dayContext += "Il caldo può aumentare stanchezza, debolezza e agitazione fisica. ";
    needs.push("bere almeno 2,5 L d'acqua");
    needs.push("mangiare qualcosa di leggero ma salato");
  }

  if (currentHumidity !== null && currentHumidity >= 65) {
    dayContext += "L'umidità alta può rendere la giornata più pesante del previsto. ";
    needs.push("bere a piccoli sorsi durante il giorno");
  }

  const cycleText = getCycleText(cyclePhase);
  if (cycleText) {
    dayContext += cycleText + " ";
    needs.push("ascoltare il corpo senza giudicarti");
  }

  if (energy <= 3) {
    dayContext += "La tua energia è bassa: oggi conviene ragionare in modalità protezione, non prestazione. ";
    needs.push("fare solo le cose essenziali");
  }

  if (mood === "Male") {
    needs.push("non interpretare ogni sensazione come un segnale grave");
  }

  if (needs.length === 0) {
    needs.push("mantenere una routine semplice");
    needs.push("bere acqua con regolarità");
    needs.push("mangiare in modo stabile");
  }

  const goal = energy <= 4 || mood === "Male"
    ? "Oggi il tuo obiettivo non è performare. È arrivare a sera stabile."
    : "Oggi il tuo obiettivo è mantenere equilibrio senza caricarti troppo.";

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

  const needsList = needs.slice(0, 3).map(item => `<li>${item}</li>`).join("");
  const reasonsText = dayScore.reasons.length > 0
    ? dayScore.reasons.join(", ")
    : "nessun fattore critico evidente";

  document.getElementById("reportText").innerHTML = `
    <h3>Indice giornata</h3>
    <p><strong>${dayScore.label}</strong></p>
    <p>${dayScore.text}</p>
    <p><strong>Fattori considerati:</strong> ${reasonsText}.</p>

    <h3>Come potrebbe influenzarti la giornata</h3>
    <p>${dayContext || "Oggi non emergono segnali particolarmente pesanti dai dati inseriti."}</p>

    <h3>Cosa ti serve oggi</h3>
    <ul>${needsList}</ul>

    ${anxietyBlock}

    <h3>Obiettivo del giorno</h3>
    <p>${goal}</p>
  `;

  document.getElementById("reportCard").style.display = "block";

  saveCheckIn({
    date: new Date().toLocaleDateString("it-IT"),
    time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    temperature: currentTemperature,
    humidity: currentHumidity,
    sleepHours,
    nightWakeups,
    mood,
    energy,
    cyclePhase,
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
        <p>Temperatura: ${item.temperature ?? "--"}°C</p>
        <p>Check-out serale: ${outcomeText}</p>
      </div>
    `;
  });

  historyCard.innerHTML = historyHTML;
  historyCard.style.display = "block";
}

function formatCycle(phase) {
  const labels = {
    non_specificato: "Non specificato",
    pre_ciclo: "Prima del ciclo",
    ciclo: "Durante il ciclo",
    post_ciclo: "Dopo il ciclo",
    ovulazione: "Ovulazione",
    nessun_sintomo: "Nessun sintomo particolare"
  };

  return labels[phase] || "Non specificato";
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
  const insights = [];

  const averageEnergy =
    lastCheckins.reduce((sum, item) => sum + Number(item.energy || 0), 0) / lastCheckins.length;

  const lowSleepDays = lastCheckins.filter(item => item.sleepHours !== null && item.sleepHours < 6);
  const goodSleepDays = lastCheckins.filter(item => item.sleepHours !== null && item.sleepHours >= 7);
  const hotDays = lastCheckins.filter(item => item.temperature !== null && item.temperature >= 30);
  const anxietyDays = lastCheckins.filter(item => item.anxiety && item.anxiety.length > 0);

  const cycleDays = lastCheckins.filter(item =>
    item.cyclePhase &&
    item.cyclePhase !== "non_specificato" &&
    item.cyclePhase !== "nessun_sintomo"
  );

  if (lowSleepDays.length >= 2) {
    const energy = lowSleepDays.reduce((sum, item) => sum + Number(item.energy || 0), 0) / lowSleepDays.length;
    insights.push(`Quando dormi meno di 6 ore, la tua energia media scende a ${energy.toFixed(1)}/10.`);
  }

  if (goodSleepDays.length >= 2) {
    const energy = goodSleepDays.reduce((sum, item) => sum + Number(item.energy || 0), 0) / goodSleepDays.length;
    insights.push(`Quando dormi almeno 7 ore, la tua energia media sale a ${energy.toFixed(1)}/10.`);
  }

  if (hotDays.length >= 2) {
    const badMood = hotDays.filter(item => item.mood === "Male" || item.mood === "Così così");
    const percentage = Math.round((badMood.length / hotDays.length) * 100);
    insights.push(`Nei giorni sopra i 30°C, nel ${percentage}% dei casi il tuo umore è stato "così così" o "male".`);
  }

  if (cycleDays.length >= 2) {
    const cycleEnergy =
      cycleDays.reduce((sum, item) => sum + Number(item.energy || 0), 0) / cycleDays.length;

    const cycleBadMood = cycleDays.filter(item => item.mood === "Male" || item.mood === "Così così");
    const percentage = Math.round((cycleBadMood.length / cycleDays.length) * 100);

    insights.push(`Nei giorni collegati al ciclo, la tua energia media è ${cycleEnergy.toFixed(1)}/10.`);
    insights.push(`Nei giorni collegati al ciclo, nel ${percentage}% dei casi il tuo umore è stato "così così" o "male".`);
  }

  const preCycleDays = lastCheckins.filter(item => item.cyclePhase === "pre_ciclo");

  if (preCycleDays.length >= 2) {
    const preCycleAnxiety = preCycleDays.filter(item => item.anxiety && item.anxiety.length > 0);
    const percentage = Math.round((preCycleAnxiety.length / preCycleDays.length) * 100);

    insights.push(`Nei giorni prima del ciclo, hai registrato preoccupazioni nel ${percentage}% dei casi.`);
  }

  if (anxietyDays.length > 0) {
    insights.push(`Hai scritto una preoccupazione in ${anxietyDays.length} check-in su ${lastCheckins.length}.`);
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
