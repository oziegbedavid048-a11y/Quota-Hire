import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

interface ShaderAnimationProps {
  isPaused?: boolean;
}

export function ShaderAnimation({ isPaused = false }: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isDarkRef = useRef(isDark);
  const isPausedRef = useRef(isPaused);

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
            vec3 darkLines = vec3(1.0) - finalColor;
            finalColor = mix(vec3(1.0), darkLines, intensity);
        }
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    const camera = new THREE.Camera();
    camera.position.z = 1;
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: {
        type: 'f',
        value: 1.0
      },
      resolution: {
        type: 'v2',
        value: new THREE.Vector2()
      },
      isDark: {
        type: 'f',
        value: isDarkRef.current ? 1.0 : 0.0
      },
      uPauseAmount: {
        type: 'f',
        value: 0.0
      }
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    // Ensure the canvas itself fills the container via CSS, regardless of
    // the buffer dimensions Three.js sets via setSize().
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
      
      const dpr = window.devicePixelRatio || 1;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      
      // Keep CSS sizing at 100% — only the drawing-buffer matters here.
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      uniforms.resolution.value.x = width * dpr;
      uniforms.resolution.value.y = height * dpr;
    };
    // ResizeObserver handles layout changes (including the initial layout
    // that may not be measurable synchronously inside useEffect).
    const ro = new ResizeObserver(() => resize());
    ro.observe(container);
    // Belt-and-suspenders: also resize on window changes and on next frame.
    window.addEventListener('resize', resize, false);
    requestAnimationFrame(resize);
    resize();
    const animate = () => {
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
    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0
    };
    animate();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resize);
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId);
        if (
        container &&
        sceneRef.current.renderer.domElement.parentNode === container)
        {
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
      className="fixed inset-0 pointer-events-none mix-blend-multiply opacity-50 dark:opacity-60 dark:mix-blend-screen overflow-hidden z-0" />
  );
}