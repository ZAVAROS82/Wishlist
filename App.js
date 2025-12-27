const form = document.getElementById("assessmentForm");
const resultSection = document.getElementById("result");
const dreamSelect = document.getElementById("dreamPosition");
const gapListEl = document.getElementById("gapAnalysis");
const trainingPlanEl = document.getElementById("trainingPlan");

let radarChart;
let progressChart;

/* Hjelp */
const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;

/* Øvelser */
const EXERCISES = {
  teknikk: ["Mottak mot vegg – 2 touch", "Førstetouch i fart", "Dribleløype med små mål"],
  fysikk: ["Sprint 10–30m x6", "Intervallspill 4v4", "Hurtige retningsforandringer"],
  forståelse: ["Småspill 3v3 maks 2 touch", "Tell hvor ofte du gjør deg spillbar", "Se kamp og stopp video"],
  mentalitet: ["Sett mål før trening", "Neste aksjon etter feil", "Positiv kommunikasjon med medspillere"],
  defensiv: ["1v1 forsvar", "Returløp småspill", "Press + sikring 2v2"]
};

/* Posisjonskrav */
const POSITION_TARGETS = {
  Kantspiller: { teknikk:4, fysikk:4, forståelse:3, mentalitet:3, defensiv:2 },
  "Sentral midtbane": { teknikk:4, forståelse:4, fysikk:3, mentalitet:3, defensiv:2 },
  "Defensiv midtbane": { forståelse:4, defensiv:4, fysikk:3, mentalitet:3, teknikk:2 },
  Back: { fysikk:4, defensiv:4, teknikk:3, mentalitet:3, forståelse:2 },
  Midtstopper: { defensiv:4, fysikk:4, forståelse:3, mentalitet:3, teknikk:2 },
  Spiss: { teknikk:4, forståelse:3, mentalitet:4, fysikk:3, defensiv:2 }
};

/* Submit */
form.addEventListener("submit", e=>{
  e.preventDefault();
  const d = new FormData(form);

  const scores = {
    teknikk: avg([+d.get("teknikk_mottak"),+d.get("teknikk_forstetouch"),+d.get("teknikk_pasning"),+d.get("teknikk_ballkontroll"),+d.get("teknikk_dribling"),+d.get("teknikk_avslutning")]),
    fysikk: avg([+d.get("fysikk_hurtighet"),+d.get("fysikk_utholdenhet"),+d.get("fysikk_styrke"),+d.get("fysikk_smidighet")]),
    forståelse: avg([+d.get("forstaelse_posisjonering"),+d.get("forstaelse_spillbarhet"),+d.get("forstaelse_valg"),+d.get("forstaelse_bevegelse"),+d.get("forstaelse_overblikk")]),
    mentalitet: avg([+d.get("mentalitet_innsats"),+d.get("mentalitet_konsentrasjon"),+d.get("mentalitet_mot"),+d.get("mentalitet_samspill"),+d.get("mentalitet_feil")]),
    defensiv: avg([+d.get("defensiv_press"),+d.get("defensiv_markering"),+d.get("defensiv_takling"),+d.get("defensiv_returlop"),+d.get("defensiv_duell")])
  };

  saveAssessment(scores);
  drawRadar(scores);
  drawProgress();
  showGap(scores);
  showTrainingPlan(scores);
  resultSection.classList.remove("hidden");
});

/* Lagring */
function saveAssessment(scores){
  const history = JSON.parse(localStorage.getItem("assessments")||"[]");
  history.push({date:new Date().toLocaleDateString(), scores});
  localStorage.setItem("assessments", JSON.stringify(history));
}

/* Radar */
function drawRadar(scores){
  const ctx = document.getElementById("radarChart");
  if(radarChart) radarChart.destroy();
  radarChart = new Chart(ctx,{type:"radar",data:{labels:Object.keys(scores),datasets:[{label:"Nå",data:Object.values(scores)}]},options:{scales:{r:{min:0,max:5}}}});
}

/* Progresjon */
function drawProgress(){
  const history = JSON.parse(localStorage.getItem("assessments")||"[]");
  if(!history.length) return;
  const labels = history.map(h=>h.date);
  const data = Object.keys(history[0].scores).map(cat=>({label:cat,data:history.map(h=>h.scores[cat])}));
  const ctx = document.getElementById("progressChart");
  if(progressChart) progressChart.destroy();
  progressChart = new Chart(ctx,{type:"line",data:{labels,datasets:data}});
}

/* Gap */
function showGap(scores){
  const dream = dreamSelect.value;
  gapListEl.innerHTML="";
  if(!dream) return;
  Object.entries(POSITION_TARGETS[dream]).forEach(([cat,target])=>{
    if(target - scores[cat] > 0.3){
      const li=document.createElement("li");
      li.textContent=`${cat}: ${EXERCISES[cat].join(", ")}`;
      gapListEl.appendChild(li);
    }
  });
}

/* 4-ukers visuell plan */
function showTrainingPlan(scores){
  const dream = dreamSelect.value;
  if(!dream) return;
  trainingPlanEl.innerHTML="";

  const gaps = Object.entries(POSITION_TARGETS[dream])
    .map(([cat,target])=>({cat,diff:target-scores[cat]}))
    .filter(g=>g.diff>0.3)
    .sort((a,b)=>b.diff-a.diff);

  const emojiMap={teknikk:"⚽",fysikk:"🏃",forståelse:"🧠",defensiv:"💪",mentalitet:"🏅"};

  for(let week=1;week<=4;week++){
    const card=document.createElement("div");
    card.className="week-card";
    const title=document.createElement("h4");
    title.textContent=`Uke ${week}`;
    card.appendChild(title);
    const ul=document.createElement("ul");

    gaps.slice(0,2).forEach((g,i)=>{
      const exIndex=(week+i)%EXERCISES[g.cat].length;
      const ex=EXERCISES[g.cat][exIndex];
      const li=document.createElement("li");
      li.className="exercise";
      li.textContent=`${emojiMap[g.cat]} ${g.cat}: ${ex}`;

      if(g.diff>=1.5) li.style.backgroundColor="#e74c3c";
      else if(g.diff>=0.8) li.style.backgroundColor="#f1c40f";
      else li.style.backgroundColor="#2ecc71";

      ul.appendChild(li);
    });

    card.appendChild(ul);
    trainingPlanEl.appendChild(card);
  }
}