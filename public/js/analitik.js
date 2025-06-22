async function loadAnalytics() {
  const res = await fetch("/api/analytics");
  const data = await res.json();

  document.getElementById("totalMessages").textContent = `Total Messages: ${data.totalMessages}`;
  document.getElementById("todayMessages").textContent = `Today's Messages: ${data.todayMessages}`;

  document.getElementById("totalTasks").textContent = `Total Tasks: ${data.totalTasks}`;
  document.getElementById("completedTasks").textContent = `Completed Tasks: ${data.completedTasks}`;
  document.getElementById("completionRate").textContent = `Completion Rate: ${data.completionRate}%`;

  document.getElementById("todayTime").textContent = `Today's Active Time: ${data.todayTime}`;
  document.getElementById("weeklyTime").textContent = `Weekly Active Time: ${data.weeklyTime}`;
}

window.onload = loadAnalytics;

// Ambil data dari server
fetch('/api/mood-data')
  .then(res => res.json())
  .then(data => renderMoodChart(data));

function renderMoodChart(moodData) {
  const ctx = document.getElementById('moodChart').getContext('2d');

  const labels = moodData.map(d => d.date);
  const damai = moodData.map(d => d.damai || 0);
  const menegangkan = moodData.map(d => d.menegangkan || 0);
  const netral = moodData.map(d => d.netral || 0);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Diskusi Damai',
          data: damai,
          backgroundColor: 'rgba(34,197,94,0.7)' // hijau
        },
        {
          label: 'Diskusi Menegangkan',
          data: menegangkan,
          backgroundColor: 'rgba(239,68,68,0.7)' // merah
        },
        {
          label: 'Diskusi Netral',
          data: netral,
          backgroundColor: 'rgba(59,130,246,0.7)' // biru
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Perkembangan Suasana Diskusi (30 Hari Terakhir)'
        }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true }
      }
    }
  });
}

