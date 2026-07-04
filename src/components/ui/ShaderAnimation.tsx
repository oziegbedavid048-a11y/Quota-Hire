import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

interface ShaderAnimationProps {
  isPaused?: boolean;
  className?: string;
}

export function ShaderAnimation({ isPaused = false, className }: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isDarkRef = useRef(isDark);
  const isPausedRef = useRef(isPaused);
  // Track whether the RAF loop is currently running so we don't start it twice
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const sceneRef = useRef<{
    camera: THREE.Camera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    uniforms: any;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `;
    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float isDark;
      uniform float uPauseAmount;
      
      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t_moving = time*0.05;
        float t_static = 0.15; // Bright phase
        float lineWidth = 0.002;
        
        vec3 color_moving = vec3(0.0);
        if (uPauseAmount < 1.0) {
          for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
              color_moving[j] += lineWidth*float(i*i) / abs(fract(t_moving - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
          }
        }
        
        vec3 color_static = vec3(0.0);
        if (uPauseAmount > 0.0) {
          for(int j = 0; j < 3; j++){
            for(int i=0; i < 5; i++){
              color_static[j] += lineWidth*float(i*i) / abs(fract(t_static - 0.01*float(j)+float(i)*0.01)*5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
          }
        }
        
        vec3 color = mix(color_moving, color_static, uPauseAmount);
        vec3 finalColor = vec3(color[0], color[1], color[2]);
        
        if (isDark < 0.5) {
            float intensity = min(1.0, length(finalColor));
            finalColor = mix(vec3(1.0), finalColor, intensity);
        }
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { type: 'f', value: 1.0 },
      resolution: { type: 'v2', value: new THREE.Vector2() },
      isDark: { type: 'f', value: isDarkRef.current ? 1.0 : 0.0 },
      uPauseAmount: { type: 'f', value: 0.0 }
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    // ── FIX #1: Cap pixel ratio at 1.5 ──────────────────────────────────────
    // Full DPR (e.g. 3.0 on iPhone) forces rendering 9x the pixels for no
    // visible quality benefit at 60fps. 1.5 is a great balance.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    container.appendChild(canvas);

    const resize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      if (width === 0 || height === 0) return;
      // ── FIX #1b: also cap DPR in resize ────────────────────────────────
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      uniforms.resolution.value.x = width * dpr;
      uniforms.resolution.value.y = height * dpr;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    window.addEventListener('resize', resize, false);
    requestAnimationFrame(resize);
    resize();

    const animate = () => {
      if (!isAnimatingRef.current) return; // stop loop cleanly
      const animationId = requestAnimationFrame(animate);

      if (isPausedRef.current) {
        uniforms.uPauseAmount.value = Math.min(1.0, uniforms.uPauseAmount.value + 0.05);
      } else {
        uniforms.uPauseAmount.value = Math.max(0.0, uniforms.uPauseAmount.value - 0.05);
      }

      if (uniforms.uPauseAmount.value < 1.0) {
        uniforms.time.value += 0.05;
      }

      uniforms.isDark.value = isDarkRef.current ? 1.0 : 0.0;
      renderer.render(scene, camera);
      if (sceneRef.current) {
        sceneRef.current.animationId = animationId;
      }
    };

    sceneRef.current = { camera, scene, renderer, uniforms, animationId: 0 };

    // ── FIX #2: IntersectionObserver — stop RAF when off-screen ─────────────
    // When the shader canvas scrolls out of view, the RAF loop is cancelled
    // completely. The GPU goes idle. When it comes back into view, the loop
    // restarts exactly where it left off — the user sees no visual glitch.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isAnimatingRef.current) {
            isAnimatingRef.current = true;
            animate();
          }
        } else {
          isAnimatingRef.current = false;
          if (sceneRef.current) {
            cancelAnimationFrame(sceneRef.current.animationId);
          }
        }
      },
      { threshold: 0 }
    );
    io.observe(container);

    // Start the loop immediately (canvas IS visible on mount)
    isAnimatingRef.current = true;
    animate();

    return () => {
      isAnimatingRef.current = false;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', resize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (container && sceneRef.current.renderer.domElement.parentNode === container) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className || "fixed inset-0 pointer-events-none mix-blend-multiply opacity-50 dark:opacity-60 dark:mix-blend-screen overflow-hidden z-0"} />
  );
}