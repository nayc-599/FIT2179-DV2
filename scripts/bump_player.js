/* bump_player.js — play/pause animation for the bump chart year slider */
(function() {
  let playing = false;
  let timer = null;
  let vegaView = null;
  let currentIndex = 1;
  const MAX_INDEX = 11;
  const STEP_MS = 800; // ms per year step

  // Wait for vega embed to finish then grab the view
  window.addEventListener('bumpChartReady', function(e) {
    vegaView = e.detail.view;
  });

  function buildControls() {
    const chartWrap = document.querySelector('#chart4');
    if (!chartWrap) return;

    const controls = document.createElement('div');
    controls.id = 'bump-controls';
    controls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
      padding: 0 0.5rem;
    `;

    const btn = document.createElement('button');
    btn.id = 'bump-play-btn';
    btn.textContent = '▶ Play';
    btn.style.cssText = `
      background: #1a5276;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 0.4rem 1rem;
      font-family: "DM Sans", sans-serif;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 600;
    `;

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↺ Reset';
    resetBtn.style.cssText = `
      background: transparent;
      color: #1a5276;
      border: 2px solid #1a5276;
      border-radius: 6px;
      padding: 0.4rem 1rem;
      font-family: "DM Sans", sans-serif;
      font-size: 0.95rem;
      cursor: pointer;
      font-weight: 600;
    `;

    const label = document.createElement('span');
    label.id = 'bump-year-label';
    label.style.cssText = `
      font-size: 0.95rem;
      color: #555;
      font-family: "DM Sans", sans-serif;
    `;
    label.textContent = 'Showing: 2015';

    const years = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'];

    btn.addEventListener('click', function() {
      if (playing) {
        pause();
      } else {
        play();
      }
    });

    resetBtn.addEventListener('click', function() {
      pause();
      currentIndex = 1;
      updateChart();
    });

    controls.appendChild(btn);
    controls.appendChild(resetBtn);
    controls.appendChild(label);
    chartWrap.parentNode.insertBefore(controls, chartWrap);

    function play() {
      playing = true;
      btn.textContent = '⏸ Pause';
      if (currentIndex >= MAX_INDEX) currentIndex = 1;
      timer = setInterval(function() {
        currentIndex++;
        updateChart();
        if (currentIndex >= MAX_INDEX) {
          pause();
        }
      }, STEP_MS);
    }

    function pause() {
      playing = false;
      btn.textContent = '▶ Play';
      clearInterval(timer);
    }

    function updateChart() {
      if (vegaView) {
        vegaView.signal('max_year_index', currentIndex).run();
      }
      const idx = Math.min(currentIndex - 1, years.length - 1);
      label.textContent = 'Showing up to: ' + years[idx];
    }
  }

  // Build controls once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildControls);
  } else {
    buildControls();
  }
})();