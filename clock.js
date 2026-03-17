const DOTS_COUNT = 60
const TICK = 1000
const LOCALE = "en-GB"
let clockDots = new Map()
let lastTap = 0;
let tickInterval = null

function switchTheme()
{
  let theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('clockTheme', theme)
}

function applyTheme() {
  const theme = localStorage.getItem('clockTheme');

  if (theme) {
    document.documentElement.dataset.theme = theme;
  }
}

function toggleDate()
{
  let dateElem = document.getElementById("date")
  let isHidden = dateElem.classList.contains("hidden");

  if (isHidden) {
    dateElem.classList.remove("hidden");
  } else {
    dateElem.classList.add("hidden");
  }
  localStorage.setItem("date", isHidden); // sauvegarde
}

function applyDate() {
  const showDate = localStorage.getItem('date');
  let dateElem = document.getElementById("date")
  if (showDate === "true") {
    dateElem.classList.remove("hidden")
  }
  else {
    dateElem.classList.add("hidden")
  }
}

function getNowHour() 
{
  const now = new Date();
  return now.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
} 

function getNowDate() {
  const now = new Date();
  let dayName = now.toLocaleDateString(LOCALE, { weekday: 'long' });
  let monthName = now.toLocaleDateString(LOCALE, { month: 'long' });
  return `${dayName}, ${monthName} ${now.getDate()}, ${now.getFullYear()}`
}

function getRemainMs()
{
  return TICK - new Date().getMilliseconds()
}

function setDate() 
{
  document.getElementById("time").innerHTML = getNowHour()
  document.getElementById("date").innerHTML = getNowDate()
}

function setActiveDots() 
{
  clockDots.forEach(dot => dot.classList.remove("active"));
  const nowSeconds = new Date().getSeconds();
  let activeDots = new Map([...clockDots].filter(([key]) => key <= nowSeconds));
  for (const [key, value] of activeDots) {
    value.classList.add("active")
  }
}

function updateDotTranslate() {

  const styles = getComputedStyle(document.documentElement);
  const clockRadius = styles.getPropertyValue("--clock-radius");

  for (const [key, dot] of clockDots) {
    let rad = (2 * key * Math.PI) / DOTS_COUNT - Math.PI/2;
    let x = Math.cos(rad)
    let y = Math.sin(rad)
    dot.style.translate = `${x * clockRadius}px ${y * clockRadius}px`
  }
}

function setClockDots() 
{
  const styles = getComputedStyle(document.documentElement);
  const clockRadius = styles.getPropertyValue("--clock-radius");

  let clockElm = document.getElementById("clock")
  for (let i = 0; i < DOTS_COUNT; i++) 
  {
    let dotElm = document.createElement("div")
    dotElm.classList.add("clock-dot")
    clockElm.appendChild(dotElm)
    let rad = (2 * i * Math.PI) / DOTS_COUNT - Math.PI/2;
    let x = Math.cos(rad)
    let y = Math.sin(rad)
    dotElm.style.translate = `${x * clockRadius}px ${y * clockRadius}px`
    let second = i
    if(i === 0) {
      second = 60
    }
    clockDots.set(second, dotElm);
  }
  clockDots = new Map([...clockDots].sort(([keyA], [keyB]) => keyB - keyA));
  setDate()
}

function tick() {

  setActiveDots()
  const nowSeconds = new Date().getSeconds();
  setDate()
  if(nowSeconds === 0)
  {
    document.querySelectorAll(".clock-dot.active").forEach(e => e.classList.remove("active"))
  }

  let remainingDots = new Map([...clockDots].filter(([key]) => key > nowSeconds)) // seconds
  remainingDots = new Map([...remainingDots].filter(([key]) => key <= 60 - (Math.floor(remainingDots.size * (new Date().getMilliseconds() / TICK))))) // milliseconds

  const dots = [...remainingDots.values()];
  let previousDot = null;
  let startTime = null;
  let tickStartDelay = getRemainMs() / 8
  const interval = (getRemainMs() - tickStartDelay) / remainingDots.size; 

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const index = Math.floor(elapsed / interval);

    if (index < dots.length) {
      previousDot?.classList.remove("active");
      dots[index].classList.add("active");
      previousDot = dots[index];
      requestAnimationFrame(animate);
    }
  }

  setTimeout(() => requestAnimationFrame(animate), tickStartDelay);

  setTimeout(() => {
    tick()
  }, getRemainMs())
}

function startClock() {
  clearInterval(tickInterval)
  clockDots.forEach(dot => dot.remove());
  clockDots.clear()
  setClockDots()
  tick()
}

function main() {
  applyTheme()
  applyDate()
  startClock()
}

main()

window.addEventListener('resize', updateDotTranslate);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    startClock()
  }
});

window.addEventListener("dblclick", (event) => {
  toggleDate()
})

window.addEventListener("touchend", (event) => {
  const currentTime = new Date().getTime();
  const tapLength = currentTime - lastTap;
  if (tapLength < 200 && tapLength > 0) {
    toggleDate()
    event.preventDefault();
  }
  lastTap = currentTime;
});
