import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { vertexShader, fragmentShader } from './shaders.js';

export class GlRenderer {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.mesh = null;
        this.targetElement = null; // The DOM element to match

        // Uniforms
        this.uniforms = {
            uResolution: { value: new THREE.Vector2() },
            uElementSize: { value: new THREE.Vector2() },
            uElementPos: { value: new THREE.Vector2() },
            uTime: { value: 0 },
            uHover: { value: 0 },
            uDrag: { value: 0 },
            uAlpha: { value: 1 }, // Global visibility
            uMouse: { value: new THREE.Vector2() }
        };

        this.init();
    }

    init() {
        // Create Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gl-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Let clicks pass through
        this.canvas.style.zIndex = '15'; // Above video (1), below controls content

        // Insert into DOM
        const appContainer = document.querySelector('.video-wrapper');
        appContainer.insertBefore(this.canvas, appContainer.firstChild.nextSibling);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, premultipliedAlpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0);

        // Scene & Camera (Orthographic 1:1 mapping to pixels)
        this.scene = new THREE.Scene();
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 1, 1000);
        this.camera.position.z = 10;

        // No texture needed for procedural shader

        // Create Mesh
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: this.uniforms,
            transparent: true,
            blending: THREE.AdditiveBlending, // Additive blending for gloss
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Events
        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();

        // Find DOM Target
        this.targetElement = document.querySelector('.controls-wrapper-bottom');

        // Interaction Listeners (for "Liquid Morph")
        if (this.targetElement) {
            this.targetElement.addEventListener('mouseenter', () => this.targetHover = true);
            this.targetElement.addEventListener('mouseleave', () => this.targetHover = false);
        }

        // Global mouse for distortion
        window.addEventListener('mousemove', (e) => {
            this.uniforms.uMouse.value.set(e.clientX, window.innerHeight - e.clientY);
        });

        // Start Loop
        this.animate();
    }

    syncMesh() {
        if (!this.targetElement || !this.mesh) return;

        const rect = this.targetElement.getBoundingClientRect();
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update Scale (Size)
        this.mesh.scale.set(rect.width, rect.height, 1);
        this.uniforms.uElementSize.value.set(rect.width, rect.height);

        // Coordinate System Mapping
        const meshX = (rect.left + rect.width / 2) - width / 2;
        const meshY = height / 2 - (rect.top + rect.height / 2);

        this.mesh.position.set(meshX, meshY, 0);

        // Element Pos for shader (screen coordinates)
        this.uniforms.uElementPos.value.set(rect.left, window.innerHeight - rect.bottom);
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.uniforms.uResolution.value.set(width, height);

        this.camera.left = -width / 2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = -height / 2;
        this.camera.updateProjectionMatrix();
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const time = performance.now() * 0.001;
        this.uniforms.uTime.value = time;

        // Sync Mesh Position
        this.syncMesh();

        // Smooth Hover
        const targetHover = this.targetHover ? 1 : 0;
        this.uniforms.uHover.value += (targetHover - this.uniforms.uHover.value) * 0.1;

        // Check Drag
        const dragging = document.querySelector('.progress-bar-container.dragging') ? 1 : 0;
        this.uniforms.uDrag.value += (dragging - this.uniforms.uDrag.value) * 0.1;

        // Visibility Check (New Logic)
        const overlay = document.querySelector('.controls-overlay');
        const isHidden = overlay && overlay.classList.contains('hidden');
        const targetAlpha = isHidden ? 0 : 1;

        // Smooth fade for visibility
        this.uniforms.uAlpha.value += (targetAlpha - this.uniforms.uAlpha.value) * 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}
