class Editor3D {
  constructor(viewportEl, propertiesEl) {
    this.viewportEl = viewportEl;
    this.cameraEl = this.viewportEl.querySelector('#camera');
    this.propertiesEl = propertiesEl;
    this.objects = [];
    this.selected = null;
    this.camRot = { x: 0, y: 0, z: 0 };
    this.initEvents();
  }
  initEvents() {
    document.getElementById('add-cube').addEventListener('click', () => this.addCube());
    document.getElementById('add-triangle').addEventListener('click', () => this.addTriangle());
    ['X','Y','Z'].forEach(axis => {
      const input = document.getElementById(`cam-rot${axis}`);
      input.addEventListener('change', e => this.updateCameraRot(axis.toLowerCase(), e.target.value));
    });
    document.getElementById('save-scene').addEventListener('click', () => this.saveScene());
    this.applyCameraTransform();
  }
  addCube() {
    const cube = this.createCube();
    this.cameraEl.appendChild(cube.el);
    this.objects.push(cube);
    this.selectObject(cube);
    this.makeDraggable(cube);
  }
  addTriangle() {
    const tri = this.createTriangle();
    this.cameraEl.appendChild(tri.el);
    this.objects.push(tri);
    this.selectObject(tri);
    this.makeDraggable(tri);
  }
  createCube() {
    const el = document.createElement('div');
    el.className = 'object3d';
    const size = 100;
    const half = size / 2;
    const faces = [
      { x: 0, y: 0, z: half, rx: 0, ry: 0 },    // front
      { x: half, y: 0, z: 0, rx: 0, ry: 90 },   // right
      { x: 0, y: 0, z: -half, rx: 0, ry: 180 }, // back
      { x: -half, y: 0, z: 0, rx: 0, ry: -90 }, // left
      { x: 0, y: -half, z: 0, rx: 90, ry: 0 },  // top
      { x: 0, y: half, z: 0, rx: -90, ry: 0 }   // bottom
    ];
    faces.forEach(f => {
      const face = document.createElement('div');
      face.className = 'face';
      face.style.width = `${size}px`;
      face.style.height = `${size}px`;
      face.style.transform = `translate3d(${f.x}px, ${f.y}px, ${f.z}px) rotateX(${f.rx}deg) rotateY(${f.ry}deg)`;
      el.appendChild(face);
    });
    el.style.transform = 'translate3d(200px,200px,0)';
    return { el, pos: { x: 200, y: 200, z: 0 }, rot: { x: 0, y: 0, z: 0 } };
  }
  createTriangle() {
    const el = document.createElement('div');
    el.className = 'object3d';
    const size = 100;
    const face = document.createElement('div');
    face.className = 'face polygon';
    face.style.width = `${size}px`;
    face.style.height = `${size}px`;
    // default triangle vertices in percent relative to element
    const vertices = [ {x:0, y:0}, {x:100, y:0}, {x:50, y:100} ];
    // apply initial clip-path
    face.style.clipPath = `polygon(${vertices.map(v=>`${v.x}% ${v.y}%`).join(',')})`;
    el.appendChild(face);
    el.style.transform = 'translate3d(200px,200px,0)';
    return {
      el,
      pos: { x:200, y:200, z:0 },
      rot: { x:0, y:0, z:0 },
      vertices
    };
  }
  updateCameraRot(axis, value) {
    this.camRot[axis] = parseFloat(value);
    this.applyCameraTransform();
  }
  applyCameraTransform() {
    const { x, y, z } = this.camRot;
    this.cameraEl.style.transform = `rotateX(${x}deg) rotateY(${y}deg) rotateZ(${z}deg)`;
  }
  selectObject(obj) {
    this.selected = obj;
    this.showProperties(obj);
  }
  showProperties(obj) {
    this.propertiesEl.innerHTML = '';
    ['x','y','z','rotX','rotY','rotZ'].forEach(p => {
      const label = document.createElement('label');
      label.textContent = p;
      const input = document.createElement('input');
      input.value = obj.pos[p] || obj.rot[p.replace('rot','').toLowerCase()];
      input.addEventListener('change', e => this.updateProp(p, e.target.value));
      this.propertiesEl.appendChild(label);
      this.propertiesEl.appendChild(input);
    });
    if (obj.vertices) {
      const face = obj.el.querySelector('.polygon');
      obj.vertices.forEach((v,i) => {
        ['x','y'].forEach(axis => {
          const name = `v${i+1}${axis}`;
          const label = document.createElement('label');
          label.textContent = name;
          const input = document.createElement('input');
          input.type = 'number';
          input.value = obj.vertices[i][axis];
          input.addEventListener('change', e => {
            obj.vertices[i][axis] = parseFloat(e.target.value);
            face.style.clipPath = `polygon(${obj.vertices.map(v=>`${v.x}% ${v.y}%`).join(',')})`;
          });
          this.propertiesEl.appendChild(label);
          this.propertiesEl.appendChild(input);
        });
      });
    }
  }
  updateProp(prop, value) {
    if (!this.selected) return;
    if (prop.startsWith('rot')) {
      const axis = prop.replace('rot','').toLowerCase();
      this.selected.rot[axis] = parseFloat(value);
    } else {
      this.selected.pos[prop] = parseFloat(value);
    }
    this.applyTransform(this.selected);
  }
  applyTransform(obj) {
    const { x,y,z } = obj.pos;
    const { x:rx, y:ry, z:rz } = obj.rot;
    obj.el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  }
  makeDraggable(obj) {
    let start;
    const onMouseDown = e => {
      start = { x: e.clientX, y: e.clientY, pos: {...obj.pos} };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
    const onMouseMove = e => {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      obj.pos.x = start.pos.x + dx;
      obj.pos.y = start.pos.y + dy;
      this.applyTransform(obj);
      this.showProperties(obj);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    obj.el.addEventListener('mousedown', onMouseDown);
  }
  saveScene() {
    const name = prompt('Enter file name');
    if (!name) return;
    const html = this.generateHTML(name);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  generateHTML(title) {
    // Clone current camera scene markup
    const cameraHTML = this.cameraEl.outerHTML;
    return `<!-- Created with 3D CSS Model Editor by @SuperGamer001 https://github.com/SuperGamer001 -> https://github.com/SuperGamer001/3d-css-model-editor -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="viewport">
    ${cameraHTML}
  </div>
</body>
</html>`;
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const editor = new Editor3D(
    document.getElementById('viewport'),
    document.getElementById('props-content')
  );
});
