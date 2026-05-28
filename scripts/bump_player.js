/* bump_player.js — play/pause animation for the bump chart year slider */
(function() {
  let playing = false;
  let timer = null;
  let vegaView = null;
  let currentIndex = 1;
  const MAX_INDEX = 12;
  const STEP_MS = 800;

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
    btn.className = 'player-btn';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '↺ Reset';
    resetBtn.className = 'player-btn secondary';

    const label = document.createElement('span');
    label.id = 'bump-year-label';
    label.style.cssText = `
      font-size: 0.95rem;
      color: #8aa4c0;
      font-family: "DM Sans", sans-serif;
    `;
    label.textContent = 'Showing: 2015';

    const years = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2025'];

    btn.addEventListener('click', function() {
      if (playing) { pause(); } else { play(); }
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
        if (currentIndex >= MAX_INDEX) { pause(); }
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildControls);
  } else {
    buildControls();
  }
})();