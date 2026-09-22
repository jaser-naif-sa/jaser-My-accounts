// ===== ID =====
const DISCORD_USER_ID = '1399459909778542856';

// ===== العمر =====
const BIRTH_DATE = new Date('2007-12-17');

function calculateAge() {
  const today = new Date();
  let age = today.getFullYear() - BIRTH_DATE.getFullYear();
  const monthDiff = today.getMonth() - BIRTH_DATE.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < BIRTH_DATE.getDate())) age--;
  return age;
}

function updateAge() {
  const el = document.getElementById('age');
  if (el) el.textContent = calculateAge();
}

// ===== التاريخ =====
function updateFooterDate() {
  const el = document.getElementById('footerDate');
  if (!el) return;
  const now = new Date();
  const lang = document.documentElement.lang || 'ar';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = '© ' + now.getFullYear() + ' · ' + now.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', options);
}

// ===== الترجمات =====
const translations = {
  ar: {
    fullname: 'جاسر بن نايف',
    location: 'المملكة العربية السعودية',
    years: 'عام',
    tiktok: 'تيك توك',
    snapchat: 'سناب شات',
    watchlist: 'قائمة المشاهدة',
    playlist: 'قائمة الأغاني',
    instagram: 'إنستغرام',
    noActivity: 'لا يوجد نشاط حالياً',
    open: 'افتح',
    nowWatching: 'أشاهد الآن'
  },
  en: {
    fullname: 'jaser bin naif',
    location: 'Saudi Arabia',
    years: 'years old',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    watchlist: 'Watchlist',
    playlist: 'Music Playlist',
    instagram: 'Instagram',
    noActivity: 'No activity',
    open: 'Open',
    nowWatching: 'Now Watching'
  }
};

// ===== الكتابة =====
let typewriterInterval;
function typewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;
  clearInterval(typewriterInterval);
  const lang = document.documentElement.lang || 'ar';
  const text = translations[lang].fullname;
  let i = 0;
  el.textContent = '';
  el.classList.remove('done');
  typewriterInterval = setInterval(function() {
    el.textContent = text.substring(0, i + 1);
    i++;
    if (i >= text.length) {
      clearInterval(typewriterInterval);
      el.classList.add('done');
    }
  }, 80);
}

// ===== تغيير اللغة =====
function setLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-key]').forEach(function(el) {
    const key = el.dataset.key;
    if (key === 'fullname') return;
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });

  document.querySelectorAll('.lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  localStorage.setItem('site-lang', lang);
  typewriter();
  fetchDiscordActivity();
  updateFooterDate();
}

document.querySelectorAll('.lang-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { setLanguage(btn.dataset.lang); });
});

// ===== جلب الحالة =====
async function fetchDiscordActivity() {
  const card = document.getElementById('discord-activity');
  const statusDot = document.getElementById('statusDot');
  const lang = document.documentElement.lang || 'ar';
  const noActivityText = translations[lang].noActivity;
  const openText = translations[lang].open;

  try {
    const res = await fetch('https://api.lanyard.rest/v1/users/' + DISCORD_USER_ID);
    const json = await res.json();

    if (!json.success) {
      card.innerHTML = '<span style="color:#6b6d75;font-size:12px;">تعذر جلب الحالة</span>';
      return;
    }

    const data = json.data;
    card.className = 'activity-card';

    if (statusDot) {
      const colors = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' };
      statusDot.style.background = colors[data.discord_status] || '#80848e';
    }

    let activity = null;
    for (let i = 0; i < data.activities.length; i++) {
      if (data.activities[i].type !== 4) { activity = data.activities[i]; break; }
    }

    // ===== Spotify =====
    if (data.listening_to_spotify && data.spotify) {
      const s = data.spotify;
      card.classList.add('platform-spotify');
      const start = s.timestamps.start;
      const end = s.timestamps.end;
      const percent = Math.min(((Date.now() - start) / (end - start)) * 100, 100);
      const openUrl = 'https://open.spotify.com/track/' + s.track_id;

      card.innerHTML =
        '<div class="activity-content">' +
          '<img src="' + s.album_art_url + '" class="activity-image" alt="album">' +
          '<div class="activity-info">' +
            '<div class="activity-app spotify"><i class="fab fa-spotify"></i> Spotify</div>' +
            '<div class="activity-title">' + s.song + '</div>' +
            '<div class="activity-subtitle">' + s.artist + '</div>' +
            '<div class="activity-progress"><div class="activity-progress-bar spotify" id="progressBar" style="width:' + percent + '%"></div></div>' +
            '<div class="activity-footer">' +
              '<div class="activity-time"><i class="fas fa-clock"></i> <span id="spotify-timer">--:--</span></div>' +
              '<a href="' + openUrl + '" target="_blank" class="activity-open">' + openText + ' <i class="fas fa-arrow-up"></i></a>' +
            '</div>' +
          '</div>' +
        '</div>';
      startSpotifyTimer(s.timestamps);
      return;
    }

    // ===== نشاط آخر =====
    if (activity) {
      const appName = activity.name.toLowerCase();
      let iconClass = 'fas fa-gamepad';
      let appLabel = activity.name;
      let platformClass = 'game';
      let openUrl = null;
      let customTitle = activity.details || 'نشاط';
      let customSubtitle = activity.state || '';

      // SoundCloud
      if (appName.indexOf('soundcloud') !== -1) {
        iconClass = 'fab fa-soundcloud';
        appLabel = 'SoundCloud';
        platformClass = 'soundcloud';
        card.classList.add('platform-soundcloud');
        openUrl = 'https://on.soundcloud.com/TjML80iaVYHWYHMQnE';
      }
      // YouTube
      else if (appName.indexOf('youtube') !== -1) {
        iconClass = 'fab fa-youtube';
        appLabel = 'YouTube';
        platformClass = 'youtube';
        card.classList.add('platform-youtube');
        openUrl = 'https://youtube.com';
      }
      // منصات المشاهدة
      else if (
        appName.indexOf('stremio') !== -1 ||
        appName.indexOf('nuvio') !== -1 ||
        appName.indexOf('netflix') !== -1 ||
        appName.indexOf('shahid') !== -1 ||
        appName.indexOf('disney') !== -1 ||
        appName.indexOf('prime video') !== -1 ||
        appName.indexOf('vlc') !== -1 ||
        appName.indexOf('plex') !== -1 ||
        appName.indexOf('kodi') !== -1
      ) {
        iconClass = 'fas fa-film';
        appLabel = translations[lang].nowWatching;
        platformClass = 'watching';
        card.classList.add('platform-watching');

        // نفصل العنوان عن الحلقة
        const fullTitle = activity.details || '';
        const episode = activity.state || '';

        if (fullTitle.indexOf(' - ') !== -1) {
          const parts = fullTitle.split(' - ');
          customTitle = parts[0].trim();
          const extra = parts[1] ? parts[1].trim() : '';
          if (extra && episode) {
            customSubtitle = extra + ' · ' + episode;
          } else if (extra) {
            customSubtitle = extra;
          } else {
            customSubtitle = episode;
          }
        } else {
          customTitle = fullTitle || episode || '';
          customSubtitle = '';
        }
      }
      // Discord
      else if (appName.indexOf('discord') !== -1) {
        iconClass = 'fab fa-discord';
        appLabel = 'Discord';
        platformClass = 'discord';
      }

      // الصورة
      let img = null;
      if (activity.assets && activity.assets.large_image) {
        if (activity.assets.large_image.indexOf('mp:') === 0) {
          img = 'https://media.discordapp.net/' + activity.assets.large_image.replace('mp:', '');
        } else {
          img = 'https://cdn.discordapp.com/app-assets/' + activity.application_id + '/' + activity.assets.large_image + '.png';
        }
      }

      const imageHTML = img
        ? '<img src="' + img + '" class="activity-image" alt="activity">'
        : '<div class="activity-image placeholder">🎮</div>';

      // التقدم
      let progressHTML = '';
      let timerHTML = '';
      if (activity.timestamps && activity.timestamps.start) {
        let percent = 0;
        if (activity.timestamps.end) {
          percent = Math.min(((Date.now() - activity.timestamps.start) / (activity.timestamps.end - activity.timestamps.start)) * 100, 100);
        }
        progressHTML = '<div class="activity-progress"><div class="activity-progress-bar ' + platformClass + '" id="progressBar" style="width:' + percent + '%"></div></div>';
        timerHTML = '<div class="activity-time"><i class="fas fa-clock"></i> <span>--:--</span></div>';
      }

      const openBtnHTML = openUrl
        ? '<a href="' + openUrl + '" target="_blank" class="activity-open">' + openText + ' <i class="fas fa-arrow-up"></i></a>'
        : '';

      card.innerHTML =
        '<div class="activity-content">' +
          imageHTML +
          '<div class="activity-info">' +
            '<div class="activity-app ' + platformClass + '"><i class="' + iconClass + '"></i> ' + appLabel + '</div>' +
            '<div class="activity-title">' + customTitle + '</div>' +
            (customSubtitle ? '<div class="activity-subtitle">' + customSubtitle + '</div>' : '') +
            progressHTML +
            '<div class="activity-footer">' + timerHTML + openBtnHTML + '</div>' +
          '</div>' +
        '</div>';

      if (activity.timestamps && activity.timestamps.start) {
        startActivityTimer(activity.timestamps.start, activity.timestamps.end);
      }
      return;
    }

    // ===== لا يوجد نشاط =====
    card.innerHTML =
      '<div class="activity-content">' +
        '<div class="activity-image placeholder">💤</div>' +
        '<div class="activity-info">' +
          '<div class="activity-app discord"><i class="fab fa-discord"></i> Discord</div>' +
          '<div class="activity-title">' + noActivityText + '</div>' +
        '</div>' +
      '</div>';

  } catch (err) {
    console.error(err);
    card.innerHTML = '<span style="color:#6b6d75;font-size:12px;">خطأ في الاتصال</span>';
  }
}

// ===== مؤقت سبوتيفاي =====
let spotifyInterval;
function startSpotifyTimer(timestamps) {
  clearInterval(spotifyInterval);
  if (!timestamps) return;
  spotifyInterval = setInterval(function() {
    const timerEl = document.getElementById('spotify-timer');
    const barEl = document.getElementById('progressBar');
    if (!timerEl) { clearInterval(spotifyInterval); return; }

    const now = Date.now();
    const elapsed = Math.floor((now - timestamps.start) / 1000);
    const total = Math.floor((timestamps.end - timestamps.start) / 1000);
    const percent = Math.min((elapsed / total) * 100, 100);

    function fmt(s) {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return m + ':' + (sec < 10 ? '0' + sec : sec);
    }

    timerEl.textContent = fmt(elapsed) + ' / ' + fmt(total);
    if (barEl) barEl.style.width = percent + '%';
  }, 1000);
}

// ===== مؤقت النشاط =====
let activityInterval;
function startActivityTimer(start, end) {
  clearInterval(activityInterval);
  activityInterval = setInterval(function() {
    const timerEl = document.querySelector('#discord-activity .activity-time span');
    const barEl = document.getElementById('progressBar');
    if (!timerEl) { clearInterval(activityInterval); return; }

    const elapsed = Math.floor((Date.now() - start) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    timerEl.textContent = m + ':' + (s < 10 ? '0' + s : s);

    if (barEl && end) {
      const total = Math.floor((end - start) / 1000);
      const percent = Math.min((elapsed / total) * 100, 100);
      barEl.style.width = percent + '%';
    }
  }, 1000);
}

// ===== شريط التقدم + الرجوع =====
const progressBar = document.getElementById('scrollProgress');
const backBtn = document.getElementById('backToTop');

window.addEventListener('scroll', function() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = percent + '%';
  if (backBtn) backBtn.classList.toggle('show', scrollTop > 200);
});

if (backBtn) {
  backBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== تأثير الماوس =====
document.querySelectorAll('.link-btn').forEach(function(btn) {
  btn.addEventListener('mousemove', function(e) {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--x', x + '%');
    btn.style.setProperty('--y', y + '%');
  });
});

// ===== النجوم =====
function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    const count = Math.floor((canvas.width * canvas.height) / 12000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.5 + 0.1,
        speed: Math.random() * 0.02 + 0.005
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(function(s) {
      s.a += s.speed;
      if (s.a > 0.7 || s.a < 0.1) s.speed *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + s.a + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// ===== المودال =====
function openImageModal(src) {
  const old = document.getElementById('imageModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'imageModal';
  modal.className = 'image-modal';
  modal.innerHTML =
    '<div class="image-modal-backdrop"></div>' +
    '<div class="image-modal-content">' +
      '<button class="image-modal-close">&times;</button>' +
      '<img src="' + src + '" alt="preview">' +
    '</div>';

  document.body.appendChild(modal);
  requestAnimationFrame(function() { modal.classList.add('show'); });

  modal.querySelector('.image-modal-backdrop').addEventListener('click', closeImageModal);
  modal.querySelector('.image-modal-close').addEventListener('click', closeImageModal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeImageModal();
  });
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(function() { modal.remove(); }, 300);
}

document.addEventListener('click', function(e) {
  const img = e.target.closest('.activity-image');
  if (!img || img.classList.contains('placeholder')) return;
  if (!img.src) return;
  openImageModal(img.src);
});

// ===== التشغيل =====
window.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('site-lang') || 'ar';
  setLanguage(savedLang);

  updateAge();
  updateFooterDate();
  initStars();

  fetchDiscordActivity();
  setInterval(fetchDiscordActivity, 15000);
  setInterval(updateAge, 1000 * 60 * 60);
});