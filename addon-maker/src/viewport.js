// 3D-вьюпорт на Three.js: предпросмотр + Display/Fitting (Phase 1 — заготовка)
const SLOTS = { fp: 'От 1-го лица', tp_right: '3-е лицо (правая)', tp_left: '3-е лицо (левая)', head: 'Голова', ground: 'На земле' };
class Viewport {
  constructor(canvas, onFrame) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x111214);
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100); this.cam.position.set(2.2, 1.8, 3.2); this.cam.lookAt(0, 0.8, 0);
    this.scene.add(new THREE.AmbientLight(0xffffff, .7)); const d = new THREE.DirectionalLight(0xffffff, .8); d.position.set(3, 5, 2); this.scene.add(d);
    this.scene.add(new THREE.GridHelper(6, 12, 0x444444, 0x2a2a2a));
    // «игрок» из блоков (упрощённо): тело + рука
    const mat = new THREE.MeshLambertMaterial({ color: 0x4a7fd0 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(.5, .75, .25), mat); body.position.y = 1.1;
    const head = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), new THREE.MeshLambertMaterial({ color: 0xd9a77a })); head.position.y = 1.7;
    this.hand = new THREE.Group(); this.hand.position.set(.4, 1.3, 0);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(.25, .75, .25), new THREE.MeshLambertMaterial({ color: 0xd9a77a })); arm.position.y = -.3; this.hand.add(arm);
    this.item = new THREE.Mesh(new THREE.BoxGeometry(.1, .6, .1), new THREE.MeshLambertMaterial({ color: 0xcccccc })); this.item.position.set(0, -.7, .15); this.hand.add(this.item);
    this.scene.add(body, head, this.hand);
    this.ang = .6; this.drag = false;
    canvas.onmousedown = () => this.drag = true; window.onmouseup = () => this.drag = false;
    canvas.onmousemove = (e) => { if (this.drag) { this.ang -= e.movementX * .01; } };
    this.loop = () => { if (!this.alive) return; this.resize(); const r = 4.2; this.cam.position.set(Math.sin(this.ang) * r, 1.8, Math.cos(this.ang) * r); this.cam.lookAt(0, 1, 0); this.renderer.render(this.scene, this.cam); requestAnimationFrame(this.loop); };
    this.alive = true; this.loop();
  }
  resize() { const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (this.canvas.width !== w || this.canvas.height !== h) { this.renderer.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); } }
  setItemColor(hex) { this.item.material.color.set(hex); }
  applyTransform(t) { this.item.position.set(t.pos[0], -.7 + t.pos[1], .15 + t.pos[2]); this.item.rotation.set(...t.rot.map(v => v * Math.PI / 180)); this.item.scale.setScalar(t.scale); }
  dispose() { this.alive = false; this.renderer.dispose(); }
}
