(function initThemeToggle(){
  const nav = document.querySelector('.nav-inner');
  if (!nav) return;
  const root = document.documentElement;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'theme-toggle';

  function apply(theme){
    const light = theme === 'light';
    if (light) root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    btn.textContent = light ? 'Dark' : 'Light';
    btn.setAttribute('aria-pressed', light ? 'true' : 'false');
    btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }

  apply(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', next); } catch (e) {}
    apply(next);
  });
  const links = nav.querySelector('.nav-links');
  if (links){
    const item = document.createElement('li');
    item.appendChild(btn);
    links.appendChild(item);
  } else {
    nav.appendChild(btn);
  }
})();

document.querySelectorAll('.teaser-grid, .notes-grid').forEach(grid => {
  const hover = grid.querySelector('.teaser-hover');
  if (!hover) return;
  let hideTimer = 0;
  const place = (card) => {
    clearTimeout(hideTimer);
    const gridRect = grid.getBoundingClientRect();
    const rect = card.getBoundingClientRect();
    hover.style.left = `${rect.left - gridRect.left}px`;
    hover.style.top = `${rect.top - gridRect.top}px`;
    hover.style.width = `${rect.width}px`;
    hover.style.height = `${rect.height}px`;
    hover.style.opacity = '1';
  };
  grid.querySelectorAll('.teaser-card, .note-card').forEach(card => {
    card.addEventListener('mouseenter', () => place(card));
    card.addEventListener('focus', () => place(card));
  });
  grid.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => { hover.style.opacity = '0'; }, 200);
  });
  grid.addEventListener('focusout', (event) => {
    if (!grid.contains(event.relatedTarget)){
      hideTimer = setTimeout(() => { hover.style.opacity = '0'; }, 200);
    }
  });
});

const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, {threshold:0.12});
  revealEls.forEach(el=>io.observe(el));
} else {
  revealEls.forEach(el=>el.classList.add('in'));
}

// Off the Clock photos: a circular gallery that turns on its own.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const circularGalleries = [];

document.querySelectorAll('.carousel').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('.carousel-slide')];
  const counter = carousel.querySelector('.carousel-counter');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  if (reducedMotion || slides.length < 2){
    let index = 0;
    const render = () => {
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
      if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    };
    prevBtn?.addEventListener('click', () => {
      index = (index - 1 + slides.length) % slides.length;
      render();
    });
    nextBtn?.addEventListener('click', () => {
      index = (index + 1) % slides.length;
      render();
    });
    render();
    return;
  }

  carousel.querySelector('.carousel-nav')?.remove();
  carousel.classList.add('circ-gallery');

  const stage = document.createElement('div');
  stage.className = 'circ-stage';
  slides.forEach(slide => {
    slide.classList.remove('carousel-slide', 'active');
    slide.classList.add('circ-card');
    stage.appendChild(slide);
  });
  carousel.append(stage);

  const entry = {
    carousel,
    stage,
    slides,
    n: slides.length,
    phase: circularGalleries.length * 0.7,
  };
  circularGalleries.push(entry);
  layoutCircular(entry, entry.phase);
});

function layoutCircular(entry, rotation){
  const {stage, slides, n} = entry;
  const radius = Math.min(128, stage.clientWidth * 0.34);

  slides.forEach((slide, i) => {
    const angle = rotation + (i / n) * Math.PI * 2;
    const depth = Math.cos(angle);
    const x = Math.sin(angle) * radius;
    const scale = 0.62 + 0.38 * ((depth + 1) / 2);
    const opacity = 0.38 + 0.62 * ((depth + 1) / 2);
    slide.style.transform = `translate(-50%, -50%) translate(${x}px, 0) rotateY(${Math.sin(angle) * -34}deg) scale(${scale})`;
    slide.style.zIndex = String(Math.round((depth + 1) * 100));
    slide.style.opacity = String(opacity);
  });
}

if (circularGalleries.length){
  const turnSeconds = 42;
  let raf = 0;
  let running = false;
  const startedAt = performance.now();

  function tick(now){
    const rotation = ((now - startedAt) / 1000 / turnSeconds) * Math.PI * 2;
    circularGalleries.forEach(entry => {
      const rect = entry.carousel.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight){
        layoutCircular(entry, entry.phase + rotation);
      }
    });
    if (running) raf = requestAnimationFrame(tick);
  }

  function startSpin(){
    if (running || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stopSpin(){
    running = false;
    cancelAnimationFrame(raf);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSpin();
    else startSpin();
  });
  window.addEventListener('resize', () => {
    const elapsed = (performance.now() - startedAt) / 1000 / turnSeconds * Math.PI * 2;
    circularGalleries.forEach(entry => layoutCircular(entry, entry.phase + elapsed));
  });
  startSpin();
}

// Home hero: Oceanic preset from https://componentry.dev/docs/components/animated-gradient
(function initHeroGradient(){
  const canvas = document.getElementById('hero-gradient-canvas');
  const hero = document.querySelector('.hero-ocean');
  const nav = document.querySelector('header.nav');
  if (!canvas || !hero) return;

  if (nav){
    const syncNav = () => {
      nav.classList.toggle('on-hero', window.scrollY < hero.offsetHeight - 72);
    };
    syncNav();
    window.addEventListener('scroll', syncNav, {passive:true});
  }

  const params = {
    color1: '#000814',
    color2: '#001d3d',
    color3: '#00b4d8',
    rotation: 0,
    proportion: 70,
    scale: 0.4,
    speed: 10,
    distortion: 15,
    swirl: 50,
    swirlIterations: 12,
    softness: 80,
    offset: 150,
    shape: 0,
    shapeSize: 30,
  };

  const gl = canvas.getContext('webgl2', {
    premultipliedAlpha: true,
    alpha: true,
    antialias: true,
  });
  if (!gl) return;

  const vertexSource = `#version 300 es
    in vec4 a_position;
    void main() { gl_Position = a_position; }`;

  const fragmentSource = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;

  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);

  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  float t = .5 * u_time;

  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);

  float shape = 0.;
  float mixer = 0.;
  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(u_color1, u_color2, u_color3, mixer, 1. - clamp(u_softness, 0., 1.), .01 + .01 * u_scale);

  fragColor = vec4(color_mix.rgb, color_mix.a);
}`;

  function compile(type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    u_time: gl.getUniformLocation(program, 'u_time'),
    u_resolution: gl.getUniformLocation(program, 'u_resolution'),
    u_pixelRatio: gl.getUniformLocation(program, 'u_pixelRatio'),
    u_scale: gl.getUniformLocation(program, 'u_scale'),
    u_rotation: gl.getUniformLocation(program, 'u_rotation'),
    u_color1: gl.getUniformLocation(program, 'u_color1'),
    u_color2: gl.getUniformLocation(program, 'u_color2'),
    u_color3: gl.getUniformLocation(program, 'u_color3'),
    u_proportion: gl.getUniformLocation(program, 'u_proportion'),
    u_softness: gl.getUniformLocation(program, 'u_softness'),
    u_shape: gl.getUniformLocation(program, 'u_shape'),
    u_shapeScale: gl.getUniformLocation(program, 'u_shapeScale'),
    u_distortion: gl.getUniformLocation(program, 'u_distortion'),
    u_swirl: gl.getUniformLocation(program, 'u_swirl'),
    u_swirlIterations: gl.getUniformLocation(program, 'u_swirlIterations'),
  };

  function hexToRgb(hex){
    const c = hex.slice(1);
    return [
      parseInt(c.slice(0, 2), 16) / 255,
      parseInt(c.slice(2, 4), 16) / 255,
      parseInt(c.slice(4, 6), 16) / 255,
    ];
  }

  const c1 = hexToRgb(params.color1);
  const c2 = hexToRgb(params.color2);
  const c3 = hexToRgb(params.color3);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container = canvas.parentElement;
  let raf = 0;
  let running = false;

  function resize(){
    const width = container.clientWidth;
    const height = container.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(height * pixelRatio));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  const start = performance.now();

  function draw(time){
    const elapsed = reduced ? 0 : (time - start) / 1000;
    const speed = (params.speed / 100) * 5;
    gl.uniform1f(uniforms.u_time, elapsed * speed + params.offset * 0.01);
    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.u_pixelRatio, Math.min(window.devicePixelRatio || 1, 2));
    gl.uniform1f(uniforms.u_scale, params.scale);
    gl.uniform1f(uniforms.u_rotation, (params.rotation * Math.PI) / 180);
    gl.uniform4f(uniforms.u_color1, c1[0], c1[1], c1[2], 1);
    gl.uniform4f(uniforms.u_color2, c2[0], c2[1], c2[2], 1);
    gl.uniform4f(uniforms.u_color3, c3[0], c3[1], c3[2], 1);
    gl.uniform1f(uniforms.u_proportion, params.proportion / 100);
    gl.uniform1f(uniforms.u_softness, params.softness / 100);
    gl.uniform1f(uniforms.u_shape, params.shape);
    gl.uniform1f(uniforms.u_shapeScale, params.shapeSize / 100);
    gl.uniform1f(uniforms.u_distortion, params.distortion / 50);
    gl.uniform1f(uniforms.u_swirl, params.swirl / 100);
    gl.uniform1f(uniforms.u_swirlIterations, params.swirl === 0 ? 0 : params.swirlIterations);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function frame(time){
    draw(time);
    if (!reduced && running) raf = requestAnimationFrame(frame);
  }

  function startLoop(){
    if (running || reduced || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function stopLoop(){
    running = false;
    cancelAnimationFrame(raf);
  }

  resize();
  if (typeof ResizeObserver !== 'undefined'){
    new ResizeObserver(resize).observe(container);
  } else {
    window.addEventListener('resize', resize);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLoop();
    else if (!reduced) startLoop();
  });

  if (reduced) draw(start);
  else startLoop();
})();

// Pixel canvas across the site, except the home hero.
// https://componentry.dev/docs/components/pixel-canvas
(function initPixelCanvas(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.createElement('div');
  container.className = 'pixel-canvas';
  container.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);

  const hero = document.querySelector('.hero-ocean');
  const ctx = canvas.getContext('2d', {alpha: true});
  if (!ctx) return;

  const gap = 6;
  const speed = 0.02;
  const colors = ['#014e68', '#00b4d8', '#90e0ef', '#e7f8fb'];
  const pixelSize = Math.max(gap, 4);
  const radius = 120;
  const mouse = {x: -1000, y: -1000};
  let cols = 0;
  let rows = 0;
  let pixels = [];
  let raf = 0;
  let running = false;
  let lastTime = 0;

  function hexToRgb(hex){
    const value = hex.slice(1);
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }

  const rgb = colors.map(hexToRgb);

  function colorFromIntensity(intensity, phase){
    const t = (phase + intensity) % 1;
    const scaled = t * (rgb.length - 1);
    const index = Math.floor(scaled);
    const next = Math.min(index + 1, rgb.length - 1);
    const localT = scaled - index;
    const a = rgb[index];
    const b = rgb[next];
    const r = Math.round(a[0] + (b[0] - a[0]) * localT);
    const g = Math.round(a[1] + (b[1] - a[1]) * localT);
    const bl = Math.round(a[2] + (b[2] - a[2]) * localT);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  function initPixels(){
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(rect.width / pixelSize);
    rows = Math.ceil(rect.height / pixelSize);
    const next = [];
    for (let i = 0; i < cols; i++){
      const col = [];
      for (let j = 0; j < rows; j++){
        const existing = pixels[i]?.[j];
        col.push({
          x: i * pixelSize,
          y: j * pixelSize,
          size: pixelSize - 1,
          intensity: existing?.intensity ?? 0,
          targetIntensity: 0,
          colorPhase: existing?.colorPhase ?? Math.random(),
        });
      }
      next.push(col);
    }
    pixels = next;
  }

  function draw(timestamp){
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    let lit = 0;

    for (let i = 0; i < cols; i++){
      const col = pixels[i];
      if (!col) continue;
      for (let j = 0; j < rows; j++){
        const pixel = col[j];
        const centerX = pixel.x + pixel.size / 2;
        const centerY = pixel.y + pixel.size / 2;
        const dx = mouse.x - centerX;
        const dy = mouse.y - centerY;
        const distance = Math.hypot(dx, dy);
        pixel.targetIntensity = distance < radius ? Math.pow(1 - distance / radius, 1.5) : 0;
        const lerpSpeed = pixel.targetIntensity > pixel.intensity ? 0.3 : speed;
        pixel.intensity += (pixel.targetIntensity - pixel.intensity) * lerpSpeed;
        pixel.colorPhase = (pixel.colorPhase + 0.001 * (deltaTime / 16)) % 1;
        if (pixel.intensity <= 0.01) continue;
        lit++;
        const color = colorFromIntensity(pixel.intensity, pixel.colorPhase);
        if (pixel.intensity > 0.2){
          const glowSize = pixel.size + 4;
          const glowOffset = (glowSize - pixel.size) / 2;
          ctx.globalAlpha = pixel.intensity * 0.15;
          ctx.fillStyle = color;
          ctx.fillRect(pixel.x - glowOffset, pixel.y - glowOffset, glowSize, glowSize);
        }
        ctx.globalAlpha = pixel.intensity * 0.9;
        ctx.fillStyle = color;
        ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size);
      }
    }
    ctx.globalAlpha = 1;

    const pointerNear = mouse.x > -500;
    if (!pointerNear && lit === 0){
      running = false;
      return;
    }
    if (running) raf = requestAnimationFrame(draw);
  }

  function start(){
    if (running || document.hidden) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(draw);
  }

  function pointerIsOverHero(x, y){
    if (!hero) return false;
    const rect = hero.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  window.addEventListener('pointermove', (e) => {
    if (pointerIsOverHero(e.clientX, e.clientY)){
      mouse.x = -1000;
      mouse.y = -1000;
    } else {
      const rect = container.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    start();
  });
  window.addEventListener('pointerleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
    start();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      running = false;
      cancelAnimationFrame(raf);
    }
  });

  initPixels();
  window.addEventListener('resize', initPixels);
})();