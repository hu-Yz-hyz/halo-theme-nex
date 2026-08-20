/* ========== EverUs Theme JS for Halo ========== */

/* ==========  布局级初始化（仅首次加载执行一次）  ========== */
function initLayoutOnce() {
  if (window.__everusLayoutReady) return;
  window.__everusLayoutReady = true;

  initNexCore();

  (function ($) {
    /* ---------  Scroll Box (Back to top)  --------- */
    $('.huojian__toggle').click(function () {
      $('html,body').animate({ scrollTop: 0 }, 500, function () {
        $('body').removeClass('nav-fixed');
      });
    });

    $(window).on('scroll', function () {
      var fromTop = $(window).scrollTop();
      if (fromTop > 50) {
        $('.huojian__toggle').removeClass('hidden');
        $('body').addClass('nav-fixed');
      } else {
        $('.huojian__toggle').addClass('hidden');
        $('body').removeClass('nav-fixed');
      }
    });

    /* ---------  Nav toggle (mobile)  --------- */
    $('.daohang').on('click', function (e) {
      $('body').toggleClass('nav-open');
    });
    $('body').removeClass('nav-open');

    // 点击导航链接关闭移动端菜单
    // 有子菜单的父项 → 不关闭（由手风琴逻辑控制）
    // 子菜单链接 / 普通链接 → 关闭 overlay
    $(document).on('click', '.site-nav a', function (e) {
      var parentItem = this.closest('.has-children');
      if (parentItem && parentItem.querySelector('.site-nav__submenu')) {
        return;
      }
      $('body').removeClass('nav-open');
    });

    /* ---------  Theme toggle (light/dark)  --------- */
    $('.theme__toggle').on('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('nex_theme', next); } catch (e) {}
    });
  })(jQuery);

  /* ---------  二级菜单键盘导航（布局元素，仅绑定一次）  --------- */
  (function () {
    document.querySelectorAll('.site-nav__submenu').forEach(function (submenu) {
      if (submenu.dataset.everusKeynav) return;
      submenu.dataset.everusKeynav = '1';
      var links = submenu.querySelectorAll('.site-nav__submenu-link');
      links.forEach(function (link, i) {
        link.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            var parentItem = submenu.closest('.site-nav__dropdown-item');
            if (parentItem) {
              var parentLink = parentItem.querySelector('.site-nav__dropdown-link');
              if (parentLink) parentLink.focus();
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (links[i + 1]) links[i + 1].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (links[i - 1]) {
              links[i - 1].focus();
            } else {
              var parentItem = submenu.closest('.site-nav__dropdown-item');
              if (parentItem) {
                var parentLink = parentItem.querySelector('.site-nav__dropdown-link');
                if (parentLink) parentLink.focus();
              }
            }
          }
        });
      });
    });
  })();

  /* ---------  站点状态面板切换（hover + tap）  --------- */
  (function () {
    var toggleBtn = document.querySelector('.site-status__toggle');
    var panel = document.getElementById('site-status-panel');
    if (!toggleBtn || !panel) return;
    if (toggleBtn.dataset.everusStat) return;
    toggleBtn.dataset.everusStat = '1';

    var closeTimer = null;
    var isTouch = window.matchMedia('(hover: none)').matches;

    function openPanel() {
      clearTimeout(closeTimer);
      panel.classList.add('is-open');
      toggleBtn.classList.add('is-active');
    }

    function closePanel() {
      panel.classList.remove('is-open');
      toggleBtn.classList.remove('is-active');
    }

    function scheduleClose() {
      closeTimer = setTimeout(closePanel, 200);
    }

    if (isTouch) {
      // 移动端：点击切换
      toggleBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (panel.classList.contains('is-open')) {
          closePanel();
        } else {
          openPanel();
        }
      });
      // 点击外部关闭
      document.addEventListener('click', function (e) {
        if (panel.classList.contains('is-open') && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
          closePanel();
        }
      });
    } else {
      // 桌面端：hover 触发
      toggleBtn.addEventListener('mouseenter', openPanel);
      panel.addEventListener('mouseenter', openPanel);
      toggleBtn.addEventListener('mouseleave', scheduleClose);
      panel.addEventListener('mouseleave', scheduleClose);
    }

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
      }
    });
  })();

  /* ---------  Fancybox 全局委托绑定（一次即可）  --------- */
  if (typeof Fancybox !== 'undefined') {
    try {
      Fancybox.bind("[data-fancybox='gallery']", {
        hideScrollbar: false,
        idle: false,
        Carousel: {
          transition: 'slide'
        }
      });
    } catch (e) {
      console.warn('Fancybox bind failed:', e);
    }
  }
}

/* ==========  页面级初始化（每次页面加载时执行）  ========== */
function initPageContent() {
  /* ---------  GSAP Scroll Animations  --------- */
  if (document.documentElement.classList.contains('nex-anim')) {
    initNexAnimations();
  } else {
    animateParagraphs();
  }

  /* ---------  Banner 轮播  --------- */
  initBannerCarousel();

  /* ---------  Banner 文字自定义字体  --------- */
  initBannerFonts();

  /* ---------  Active link in nav  --------- */
  setActiveLink();

  /* ---------  Fancybox .zoom 按钮委托（每页重新绑定）  --------- */
  initZoomButtons();

  /* ---------  链接页分组 tab 滚动至当前激活项  --------- */
  (function () {
    var tabBar = document.querySelector('.link-groups');
    if (!tabBar) return;
    var activeTab = tabBar.querySelector('.link-groups__tab.is-active');
    if (!activeTab) return;
    var scrollLeft = activeTab.offsetLeft - tabBar.clientWidth / 2 + activeTab.clientWidth / 2;
    if (scrollLeft > 0) {
      tabBar.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  })();

  /* ---------  派发页面就绪事件，允许第三方插件监听  --------- */
  document.dispatchEvent(new CustomEvent('everus:page:ready', {
    bubbles: true
  }));
}

function animateParagraphs() {
  if (typeof gsap === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray('.up, .post__content > p').forEach(function (el, i) {
    gsap.fromTo(el, {
      opacity: 0,
      y: 30
    }, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: Math.min(i * 0.01, 0.1),
      scrollTrigger: {
        trigger: el,
        start: 'top 95%',
        once: true
      }
    });
  });
}

/* ==========  Nex 动画引擎（由后台「动画」设置驱动）  ========== */
var NEX = {
  cfg: { global: {}, blocks: {} },
  animOn: false,
  reduced: false,
  touch: false
};

function nexNum(v, d) {
  var n = parseFloat(v);
  return isNaN(n) ? d : n;
}

function nexEffectState(effect) {
  switch (effect) {
    case 'fade-in': return { opacity: 0 };
    case 'fade-down': return { opacity: 0, y: -30 };
    case 'slide-left': return { opacity: 0, x: -60 };
    case 'slide-right': return { opacity: 0, x: 60 };
    case 'zoom': return { opacity: 0, scale: 0.94 };
    case 'blur': return { opacity: 0, filter: 'blur(14px)' };
    case 'rotate': return { opacity: 0, rotate: -4, scale: 0.97, y: 18 };
    default: return { opacity: 0, y: 30 };
  }
}

function initNexCore() {
  if (window.__nexCoreReady) return;
  window.__nexCoreReady = true;

  NEX.cfg = window.NEX_ANIM || { global: {}, blocks: {} };
  NEX.cfg.global = NEX.cfg.global || {};
  NEX.cfg.blocks = NEX.cfg.blocks || {};
  NEX.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  NEX.touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  NEX.animOn = document.documentElement.classList.contains('nex-anim');

  if (!NEX.animOn) return;

  var html = document.documentElement;
  var dur = NEX.cfg.global.transition_duration;
  if (dur && parseFloat(dur) > 0) {
    html.style.setProperty('--nex-td', parseFloat(dur) + 's');
  }

  if (NEX.reduced) return;
  if (html.classList.contains('nex-ambient-cursor')) initNexCursorGlow();
  if (html.classList.contains('nex-ambient-particles')) initNexParticles();
  if (html.classList.contains('nex-ambient-parallax')) initNexParallax();
}

function initNexAnimations() {
  var html = document.documentElement;
  if (!html.classList.contains('nex-anim')) return;
  if (NEX.reduced) return;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  var global = NEX.cfg.global;
  var blocks = NEX.cfg.blocks;
  var defEffect = global.effect || 'fade-up';
  var defDuration = nexNum(global.duration, 0.8);
  var defDelay = nexNum(global.delay, 0);
  var defStagger = nexNum(global.stagger, 0.08);

  // 按「父容器 + 区块」分组，每组一个 ScrollTrigger + stagger，减少实例数、提升流畅度
  var groups = [];
  document.querySelectorAll('[data-nex-anim]').forEach(function (el) {
    if (el.dataset.nexDone) return;
    var key = el.getAttribute('data-nex-anim');
    if (blocks[key + '_enable'] === false) return;
    var effect = blocks[key + '_effect'] || defEffect;
    if (effect === 'none') return;

    var parent = el.parentNode;
    var found = null;
    for (var g = 0; g < groups.length; g++) {
      if (groups[g].parent === parent && groups[g].key === key) {
        found = groups[g];
        break;
      }
    }
    if (!found) {
      found = { parent: parent, key: key, els: [] };
      groups.push(found);
    }
    found.els.push(el);
  });

  groups.forEach(function (grp) {
    var els = grp.els;
    var key = grp.key;
    var effect = blocks[key + '_effect'] || defEffect;
    var bDur = parseFloat(blocks[key + '_duration']);
    var duration = bDur > 0 ? bDur : defDuration;
    var stagger = els.length > 1 ? Math.min(defStagger, 1.2 / els.length) : 0;

    els.forEach(function (el) {
      el.style.transition = 'none';
      el.dataset.nexDone = '1';
    });

    gsap.fromTo(els, nexEffectState(effect), {
      opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: 'blur(0px)',
      duration: duration,
      delay: defDelay,
      stagger: stagger,
      ease: 'power3.out',
      clearProps: 'all',
      overwrite: 'auto',
      onComplete: function () {
        els.forEach(function (el) {
          el.style.transition = '';
          el.style.willChange = '';
          el.style.transform = '';
          el.style.opacity = '';
          el.style.filter = '';
        });
      },
      scrollTrigger: {
        trigger: els[0],
        start: 'top 92%',
        once: true
      }
    });
  });
}

/* ---- 环境：光标光晕 ---- */
function initNexCursorGlow() {
  if (NEX.touch) return;
  var el = document.createElement('div');
  el.className = 'nex-cursor-glow';
  document.body.appendChild(el);

  var size = nexNum(NEX.cfg.global.ambient_cursor_size, 560);
  if (size < 80) size = 560;
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  var half = size / 2;

  var x = window.innerWidth / 2;
  var y = window.innerHeight / 2;
  var tx = x, ty = y;
  var shown = false;

  document.addEventListener('mousemove', function (e) {
    tx = e.clientX;
    ty = e.clientY;
    if (!shown) {
      shown = true;
      el.style.opacity = '1';
    }
  });

  function loop() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    el.style.transform = 'translate3d(' + (x - half) + 'px,' + (y - half) + 'px,0)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ---- 环境：粒子背景 ---- */
function initNexParticles() {
  if (NEX.touch) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'nex-particles';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var w = 0, h = 0, dpr = 1, particles = [];
  var color = (getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || '').trim() || '#26a760';

  function colorToRgba(c, a) {
    c = String(c).trim();
    var m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (m) {
      return 'rgba(' + m[1] + ',' + m[2] + ',' + m[3] + ',' + a + ')';
    }
    var hex = c.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    if (isNaN(n)) return 'rgba(38,167,96,' + a + ')';
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.min(80, Math.floor((w * h) / 22000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.7 + 0.5,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        a: Math.random() * 0.4 + 0.25
      });
    }
  }

  resize();

  var resizeRaf = null;
  window.addEventListener('resize', function () {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = null;
      resize();
    });
  });

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -4) p.x = w + 4;
      if (p.x > w + 4) p.x = -4;
      if (p.y < -4) p.y = h + 4;
      if (p.y > h + 4) p.y = -4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = colorToRgba(color, p.a);
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---- 环境：鼠标视差 ---- */
function initNexParallax() {
  if (NEX.touch) return;
  var mx = 0, my = 0, cx = 0, cy = 0;
  var items = [];
  var lastBanner = null;

  function collect() {
    items = [];
    var banner = document.getElementById('home-banner');
    if (banner) {
      lastBanner = banner;
      banner.querySelectorAll('.banner-slide').forEach(function (s) {
        items.push({ el: s, type: 'bg', depth: 6 });
      });
    }
    document.querySelectorAll('.archive-hero__thumb').forEach(function (img) {
      items.push({ el: img, type: 'xform', sign: 1, depth: 10 });
    });
  }

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX / window.innerWidth - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  });

  function tick() {
    var current = document.getElementById('home-banner');
    if (current !== lastBanner || (items.length && !items[0].el.isConnected)) {
      collect();
    }
    cx += (mx - cx) * 0.05;
    cy += (my - cy) * 0.05;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.type === 'bg') {
        it.el.style.backgroundPosition = (50 + cx * it.depth) + '% ' + (50 + cy * it.depth) + '%';
      } else {
        it.el.style.transform = 'translate3d(' + (it.sign * cx * it.depth) + 'px,' + (it.sign * cy * it.depth) + 'px,0)';
      }
    }
    requestAnimationFrame(tick);
  }

  collect();
  requestAnimationFrame(tick);
}

function setActiveLink() {
  var currentUrl = window.location.href;
  var links = document.querySelectorAll('.site-nav__dropdown-link, .site-nav__submenu-link');
  links.forEach(function (link) {
    link.classList.remove('mm-active');
    if (link.parentElement) link.parentElement.classList.remove('mm-active');
    // 标记空链接，便于 CSS 禁用交互样式
    var rawHref = link.getAttribute('href');
    var isEmpty = !rawHref || rawHref === '#' || rawHref === 'javascript:void(0)';
    link.classList.toggle('is-empty-href', isEmpty);
  });
  links.forEach(function (link) {
    // 跳过空链接：href 为空时浏览器会解析为当前页 URL，导致误激活
    if (link.classList.contains('is-empty-href')) return;
    if (link.href === currentUrl) {
      link.classList.add('mm-active');
      if (link.parentElement) link.parentElement.classList.add('mm-active');
    }
  });
}

function initZoomButtons() {
  if (typeof Fancybox === 'undefined') return;
  document.querySelectorAll('.zoom').forEach(function (button) {
    if (button.dataset.everusZoom) return;
    button.dataset.everusZoom = '1';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      var parentCard = button.closest('.work-card');
      var image = parentCard ? parentCard.querySelector('a[data-fancybox="gallery"]') : null;
      if (image) image.click();
    });
  });
}

/* ==========  Banner 轮播  ========== */
var _bannerTimer = null;

function initBannerCarousel() {
  if (_bannerTimer) {
    clearInterval(_bannerTimer);
    _bannerTimer = null;
  }

  var banner = document.getElementById('home-banner');
  if (!banner) return;
  var slides = banner.querySelectorAll('.banner-slide');
  if (slides.length <= 1) return;

  banner.classList.add('is-slideshow');

  var interval = parseFloat(banner.getAttribute('data-interval') || '5');
  if (!interval || interval <= 0) interval = 5;

  var current = 0;

  function goTo(index) {
    slides[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
  }

  function startTimer() {
    if (_bannerTimer) clearInterval(_bannerTimer);
    _bannerTimer = setInterval(function () {
      goTo(current + 1);
    }, interval * 1000);
  }

  var prevBtn = banner.querySelector('.banner__nav--prev');
  var nextBtn = banner.querySelector('.banner__nav--next');
  if (prevBtn) prevBtn.addEventListener('click', function (e) {
    e.preventDefault();
    goTo(current - 1);
    startTimer();
  });
  if (nextBtn) nextBtn.addEventListener('click', function (e) {
    e.preventDefault();
    goTo(current + 1);
    startTimer();
  });

  startTimer();
}

/* ----------  Banner 文字自定义字体（空 = 默认，不跟随全局字体）  ---------- */
function initBannerFonts() {
  var banner = document.getElementById('home-banner');
  if (!banner) return;
  var slides = banner.querySelectorAll('.banner-slide');
  for (var i = 0; i < slides.length; i++) {
    var text = slides[i].querySelector('.banner-slide__text');
    if (!text) continue;
    var fontUrl = text.getAttribute('data-font');
    if (!fontUrl) {
      text.classList.add('banner-slide__text--default');
      continue;
    }
    var name = 'banner-font-' + i;
    var style = document.createElement('style');
    style.textContent = "@font-face{font-family:'" + name + "';font-weight:400;font-style:normal;font-display:swap;src:url('" + fontUrl + "')} .banner-slide__text--font-" + i + "{font-family:'" + name + "'}";
    document.head.appendChild(style);
    text.classList.add('banner-slide__text--font-' + i);
  }
}

/* ==========  PJAX 页面过渡  ========== */
// 原理：点击内部链接 → 淡出内容 → AJAX 拉取新页面 → 替换内容 + 重新执行脚本 → 淡入。
// 与 swup 的关键区别：PJAX 手动重新执行新内容中的所有 <script>，确保评论组件等正常初始化。

(function () {
  var CONTAINER_ID = 'pjax-container';
  var isNavigating = false;

  function transitionInfo() {
    var html = document.documentElement;
    var slide = html.classList.contains('nex-transition-slide');
    var animOn = html.classList.contains('nex-anim');
    var dur = animOn ? (parseFloat(html.style.getPropertyValue('--nex-td')) || 0.35) : 0.25;
    return { slide: slide, ms: Math.max(100, Math.round(dur * 1000)) };
  }

  // 拦截内部链接点击
  document.addEventListener('click', function (e) {
    if (isNavigating) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    var link = e.target.closest('a');
    if (!link) return;
    // 空链接：阻止默认跳转（href 为空时浏览器解析为当前页 URL，点击会整页刷新）
    var rawHref = link.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref === 'javascript:void(0)') {
      e.preventDefault();
      return;
    }
    if (!link.href || link.target === '_blank' || link.hasAttribute('download')) return;
    if (link.hasAttribute('data-no-pjax')) return;

    var url;
    try { url = new URL(link.href, window.location.origin); } catch (err) { return; }
    if (url.origin !== window.location.origin) return;
    // 同一页面（仅 hash 不同）不拦截
    if (url.pathname === location.pathname && url.search === location.search) return;
    // 后台 / 登录 / API
    if (url.pathname.indexOf('/console') === 0) return;
    if (url.pathname.indexOf('/login') === 0) return;
    if (url.pathname.indexOf('/apis/') === 0) return;

    e.preventDefault();
    navigateTo(url.href, false);
  });

  // 浏览器后退/前进
  window.addEventListener('popstate', function () {
    if (isNavigating) return;
    navigateTo(location.href, true);
  });

  function navigateTo(url, isPopState) {
    if (isNavigating) return;
    isNavigating = true;

    // 关闭弹层与面板
    if (typeof Fancybox !== 'undefined') { try { Fancybox.close(true); } catch (e) {} }
    var statPanel = document.getElementById('site-status-panel');
    if (statPanel) statPanel.classList.remove('is-open');
    document.body.classList.remove('nav-open');

    var container = document.getElementById(CONTAINER_ID);
    var ti = transitionInfo();

    // 淡出 + 并行 fetch
    if (container) container.classList.add('is-leaving');

    Promise.all([
      fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      }),
      new Promise(function (resolve) { setTimeout(resolve, ti.ms); })
    ]).then(function (results) {
      var html = results[0];
      var doc = new DOMParser().parseFromString(html, 'text/html');

      // ① 更新标题
      var newTitle = doc.querySelector('title');
      if (newTitle) document.title = newTitle.textContent;

      // ② 更新 meta 标签
      doc.querySelectorAll('head meta[name], head meta[property]').forEach(function (meta) {
        var attr = meta.getAttribute('name') ? 'name' : 'property';
        var val = meta.getAttribute(attr);
        var sel = 'meta[' + attr + '="' + val + '"]';
        var existing = document.head.querySelector(sel);
        if (existing) {
          existing.setAttribute('content', meta.getAttribute('content'));
        } else {
          document.head.appendChild(meta.cloneNode(true));
        }
      });

      // ③ 清理旧实例
      if (typeof ScrollTrigger !== 'undefined') {
        try { ScrollTrigger.getAll().forEach(function (t) { t.kill(); }); } catch (e) {}
      }
      if (typeof gsap !== 'undefined') {
        try { gsap.killTweensOf('.up, .post__content > p, [data-nex-anim]'); } catch (e) {}
      }

      // ④ 替换内容
      var newContainer = doc.getElementById(CONTAINER_ID);
      if (!newContainer || !container) {
        // 容器不存在 → 回退到正常跳转
        window.location.href = url;
        return;
      }
      container.innerHTML = newContainer.innerHTML;

      // ⑤ 重新执行脚本（关键步骤！innerHTML 插入的 <script> 不会自动执行）
      container.querySelectorAll('script').forEach(function (oldScript) {
        var src = oldScript.src;
        // 跳过已加载的外部脚本（避免重复执行 jQuery/GSAP 等库）
        if (src && document.querySelector('script[src="' + src + '"]')) {
          oldScript.remove();
          return;
        }
        var newScript = document.createElement('script');
        if (src) {
          newScript.src = src;
        } else {
          newScript.textContent = oldScript.textContent;
        }
        for (var i = 0; i < oldScript.attributes.length; i++) {
          var a = oldScript.attributes[i];
          if (a.name !== 'src') newScript.setAttribute(a.name, a.value);
        }
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // ⑥ 加载页面级新脚本（如评论组件脚本可能在 <body> 底部而非容器内）
      doc.querySelectorAll('body script[src]').forEach(function (script) {
        var src = script.src;
        if (!src) return;
        if (document.querySelector('script[src="' + src + '"]')) return;
        if (src.indexOf('/plugins/') === -1 && src.toLowerCase().indexOf('comment') === -1) return;
        var s = document.createElement('script');
        s.src = src;
        document.body.appendChild(s);
      });

      // ⑦ 更新 URL & 滚动
      if (!isPopState) history.pushState(null, '', url);
      window.scrollTo(0, 0);

      // ⑧ 重新初始化页面组件
      initPageContent();

      // ⑨ 淡入
      if (ti.slide) {
        container.classList.add('is-entering');
        container.classList.remove('is-leaving');
        void container.offsetWidth;
        container.classList.remove('is-entering');
        isNavigating = false;
        if (typeof ScrollTrigger !== 'undefined') {
          try { ScrollTrigger.refresh(); } catch (e) {}
        }
      } else {
        // 淡入（双 rAF 确保新内容已以 opacity:0 渲染过一帧）
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            container.classList.remove('is-leaving');
            isNavigating = false;
            // 刷新 ScrollTrigger 位置
            if (typeof ScrollTrigger !== 'undefined') {
              try { ScrollTrigger.refresh(); } catch (e) {}
            }
          });
        });
      }
    }).catch(function () {
      // 任何错误 → 回退到正常跳转
      window.location.href = url;
    });
  }
})();

/* ==========  DOM ready：首次加载初始化  ========== */
document.addEventListener('DOMContentLoaded', function () {
  initLayoutOnce();
  initPageContent();
});
