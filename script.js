

const ring = document.getElementById('ring');
const phaseLabel = document.getElementById('phase');
const countdown = document.getElementById('countdown');

const inhaleInput = document.getElementById('inhale');
const holdInput = document.getElementById('hold');
const exhaleInput = document.getElementById('exhale');
const cyclesInput = document.getElementById('cycles');

const inhaleVal = document.getElementById('inhaleVal');
const holdVal = document.getElementById('holdVal');
const exhaleVal = document.getElementById('exhaleVal');

const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');


// update outputs
function updateOutputs(){
  inhaleVal.value = inhaleInput.value;
  holdVal.value = holdInput.value;
  exhaleVal.value = exhaleInput.value;
}
updateOutputs();
[inhaleInput, holdInput, exhaleInput].forEach(i => {
  i.addEventListener('input', updateOutputs);
});


// State
let running = false;
let paused = false;
let currentPhase = null; // 'inhale' | 'hold' | 'exhale'
let remaining = 0; // ms
let phaseTimeout = null;
let intervalTimer = null;
let cyclesLeft = 0;



function getPhases(){
  const inh = parseInt(inhaleInput.value,10);
  const hold = parseInt(holdInput.value,10);
  const exh = parseInt(exhaleInput.value,10);
  const seq = [];
  seq.push({name:'inhale', seconds: inh});
  if(hold > 0) seq.push({name:'hold', seconds: hold});
  seq.push({name:'exhale', seconds: exh});
  return seq;
}


// set ring transition for animation sync
function setRingTransition(ms){
  ring.style.transition = `transform ${ms}ms ease-in-out, box-shadow ${Math.max(250, ms/6)}ms`;
}

// start sequence
function startSession(){
  if(running) return;
  running = true;
  paused = false;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  cyclesLeft = Math.max(1, parseInt(cyclesInput.value,10));
  runCycle();
}

function runCycle(){
  if(cyclesLeft <= 0){
    finishSession();
    return;
  }
  const phases = getPhases();
  runPhasesSequentially(phases, 0).then(()=>{
    cyclesLeft--;
    // short pause between cycles
    setTimeout(()=> runCycle(), 600);
  });
}

function runPhasesSequentially(phases, index){
  return new Promise((resolve)=>{
    if(index >= phases.length) return resolve();
    const p = phases[index];
    currentPhase = p.name;
    const ms = p.seconds * 1000;
    remaining = ms;

    updatePhaseUI(currentPhase);
    // set transition
    setRingTransition(ms);
    // animate ring based on phase
    applyRingTransform(currentPhase);
    // interval countdown
    intervalTimer = setInterval(()=> {
      remaining -= 100;
      if(remaining < 0) remaining = 0;
      updateCountdown(Math.ceil(remaining/1000));
    }, 100);
    // timeout for phase end
    phaseTimeout = setTimeout(()=> {
      clearInterval(intervalTimer);
      updateCountdown(0);
      runPhasesSequentially(phases, index+1).then(resolve);
    }, ms);
  });
}

function applyRingTransform(phase){
  ring.classList.remove('inhale','hold','exhale');
  void ring.offsetWidth; // force reflow
  if(phase === 'inhale'){
    ring.classList.add('inhale');
  } else if(phase === 'hold'){
    ring.classList.add('hold');
  } else {
    ring.classList.add('exhale');
  }
}

function updatePhaseUI(phaseName){
  phaseLabel.textContent = phaseName.charAt(0).toUpperCase() + phaseName.slice(1);
  updateCountdown(Math.ceil(remaining/1000));
}

function updateCountdown(sec){
  countdown.textContent = String(sec).padStart(2,'0');
}

function finishSession(){
  running = false;
  paused = false;
  currentPhase = null;
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  ring.classList.remove('inhale','hold','exhale');
  phaseLabel.textContent = 'Done';

}

// pause/resume
function pauseSession(){
  if(!running || paused) return;
  paused = true;
  clearTimeout(phaseTimeout);
  clearInterval(intervalTimer);
  // compute remaining was already kept
  pauseBtn.textContent = 'Resume';
  startBtn.disabled = true;
}

function resumeSession(){
  if(!running || !paused) return;
  paused = false;
  pauseBtn.textContent = 'Pause';

  
  resumePhase(currentPhase, remaining).then(()=>{

    
    if(cyclesLeft > 0 && !running) runCycle();
  });
}

function resumePhase(phaseName, msRemaining){
  return new Promise((resolve)=>{

    setRingTransition(msRemaining);

    intervalTimer = setInterval(()=> {
      remaining -= 100;
      if(remaining < 0) remaining = 0;
      updateCountdown(Math.ceil(remaining/1000));
    }, 100);
    phaseTimeout = setTimeout(()=> {
      clearInterval(intervalTimer);
      updateCountdown(0);
      resolve();
    }, msRemaining);
  });
}

function stopSession(){
  running = false;
  paused = false;
  clearTimeout(phaseTimeout);
  clearInterval(intervalTimer);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = 'Pause';
  resetBtn.disabled = true;
  phaseLabel.textContent = 'Ready';
  countdown.textContent = '00';
  ring.classList.remove('inhale','hold','exhale');
}


// button events
startBtn.addEventListener('click', startBtnHandler);
pauseBtn.addEventListener('click', pauseBtnHandler);
resetBtn.addEventListener('click', stopSession);

function startBtnHandler(){
  if(!running) startSession();
}
function pauseBtnHandler(){
  if(!paused) pauseSession();
  else resumeSession();
}

// keyboard: space toggles start/pause
document.addEventListener('keydown', (e)=>{
  if(e.code === 'Space'){
    e.preventDefault();
    if(!running) startSession();
    else if(!paused) pauseSession();
    else resumeSession();
  }
});
