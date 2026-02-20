import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

// --- Configuration ---
const CONFIG = {
    structure: {
        length: 96, // meters
        width: 12, // meters per port
        columnSpacing: 6, // meters
        eavesHeight: 5, // meters
        ridgeHeight: 5.9, // meters
        rafterColor: 0x1a1a1a, // Black steel
        roofSheetColor: 0x222222, // Dark grey/black trapezoidal
    },
    parking: {
        car: {
            width: 2.4,
            length: 4.8,
            angle: 45, // degrees
            aisleWidth: 3.5, // Standard one-way aisle
            lineColor: 0xffffff,
            lineWidth: 0.1,
            rows: 2,
            colors: [
                { name: 'Dark Grey', color: 0x444444 } // Only use dark grey
            ]
        },
        coach: {
            width: 3.5,
            length: 12,
            angle: 30, // Shallow angle
            lineColor: 0xffffff,
            lineWidth: 0.15,
            rows: 1,
            colors: [
                { name: 'Dark Grey', color: 0x444444 } // Only use dark grey
            ]
        }
    },
    solar: {
        width: 1.134, // meters
        length: 1.762, // meters
        rowsPerSlope: 3,
        panelsPerRow: 83,
        gapX: 0.03, // Increased gap slightly for visibility
        gapY: 0.05,
        color: 0x1e365c, // Deep blue/black
        frameColor: 0x888888 // Lighter grey for visible frame edge
    },
    vehicles: {
        carCount: 30,
        coachCount: 6
    }
};

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdcecf7);
scene.fog = new THREE.FogExp2(0xdcecf7, 0.002); // Reduced fog

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-40, 40, 60); // Higher angle, centered on crop
camera.lookAt(-40, 0, 0); // Focus on center of active area

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased ambient
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 3.5); // Stronger sun
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
sunLight.shadow.bias = -0.0005; // Fix acne
sunLight.shadow.normalBias = 0.05; // Fix self-shadowing details
scene.add(sunLight);

// --- Ground ---
const groundGeo = new THREE.PlaneGeometry(300, 300);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Grid helpers for context
const gridTargetStart = -(CONFIG.structure.length / 2);
// Simple parking lines


// --- Generators ---

function createCarStructure(color) {
    const group = new THREE.Group();

    // Lower body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 4.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5; // Raised for wheels
    body.castShadow = true;
    group.add(body);

    // Cabin / Windows (Greenhouse)
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.6, 2.2);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.2, -0.2); // Set back slightly
    cabin.castShadow = true;
    group.add(cabin);

    // Wheels (simple cylinders across)
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.9, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const wheelFront = new THREE.Mesh(wheelGeo, wheelMat);
    wheelFront.rotation.z = Math.PI / 2;
    wheelFront.position.set(0, 0.3, 1.5);
    group.add(wheelFront);

    const wheelBack = new THREE.Mesh(wheelGeo, wheelMat);
    wheelBack.rotation.z = Math.PI / 2;
    wheelBack.position.set(0, 0.3, -1.5);
    group.add(wheelBack);

    return group;
}

function createCoachStructure(color) {
    const group = new THREE.Group();

    // Main body
    const bodyGeo = new THREE.BoxGeometry(2.5, 3.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5, metalness: 0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.1; // 0.5 (wheels) + 1.6 (half height)
    body.castShadow = true;
    group.add(body);

    // Windows band
    const winGeo = new THREE.BoxGeometry(2.55, 1.0, 11.8);
    const winMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.8 });
    const windows = new THREE.Mesh(winGeo, winMat);
    windows.position.y = 2.5;
    group.add(windows);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.6, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const wheelFront = new THREE.Mesh(wheelGeo, wheelMat);
    wheelFront.rotation.z = Math.PI / 2;
    wheelFront.position.set(0, 0.5, 4.0);
    group.add(wheelFront);

    const wheelBack = new THREE.Mesh(wheelGeo, wheelMat);
    wheelBack.rotation.z = Math.PI / 2;
    wheelBack.position.set(0, 0.5, -3.5);
    group.add(wheelBack);

    const wheelBack2 = new THREE.Mesh(wheelGeo, wheelMat);
    wheelBack2.rotation.z = Math.PI / 2;
    wheelBack2.position.set(0, 0.5, -4.7);
    group.add(wheelBack2);

    return group;
}


function createStructure(offsetX, offsetY) {
    const group = new THREE.Group();

    // Derived Dimensions
    const halfSpan = CONFIG.structure.width / 2;
    const height = CONFIG.structure.eavesHeight;
    const rise = CONFIG.structure.ridgeHeight - height;
    const pitchRad = Math.atan(rise / halfSpan);
    const slopeLen = Math.sqrt(rise * rise + halfSpan * halfSpan);
    const rafterLen = slopeLen + 0.5; // +overhang

    // 1. Columns (RSJs)
    const colCount = Math.ceil(CONFIG.structure.length / CONFIG.structure.columnSpacing) + 1;
    const colGeo = new THREE.BoxGeometry(0.2, height, 0.2);
    const colMat = new THREE.MeshStandardMaterial({ color: CONFIG.structure.rafterColor, roughness: 0.7 });

    for (let i = 0; i < colCount; i++) {
        const z = (i * CONFIG.structure.columnSpacing) - (CONFIG.structure.length / 2);

        // Left Column
        const colL = new THREE.Mesh(colGeo, colMat);
        colL.position.set(-CONFIG.structure.width / 2, height / 2, z);
        colL.castShadow = true;
        colL.receiveShadow = true;
        group.add(colL);

        // Right Column
        const colR = new THREE.Mesh(colGeo, colMat);
        colR.position.set(CONFIG.structure.width / 2, height / 2, z);
        colR.castShadow = true;
        colR.receiveShadow = true;
        group.add(colR);

        // Visual Rafters (angled)
        const rafterWingGeo = new THREE.BoxGeometry(rafterLen, 0.3, 0.15);

        const rafterL = new THREE.Mesh(rafterWingGeo, colMat);
        // Midpoint of rafter logic:
        // Horizontal projection is halfSpan. Center is -halfSpan/2.
        // Vertical projection is rise. Center is height + rise/2.
        rafterL.position.set(-halfSpan / 2, height + rise / 2, z);
        rafterL.rotation.z = pitchRad;
        group.add(rafterL);

        const rafterR = new THREE.Mesh(rafterWingGeo, colMat);
        rafterR.position.set(halfSpan / 2, height + rise / 2, z);
        rafterR.rotation.z = -pitchRad;
        group.add(rafterR);
    }

    // 2. Roof Sheet
    const roofLen = CONFIG.structure.length + 1; // Slight overhang

    const roofGeo = new THREE.BoxGeometry(rafterLen, 0.05, roofLen);
    const roofMat = new THREE.MeshStandardMaterial({ color: CONFIG.structure.roofSheetColor, roughness: 0.6, metalness: 0.3 });

    const roofL = new THREE.Mesh(roofGeo, roofMat);
    roofL.position.set(-halfSpan / 2, height + rise / 2 + 0.15, 0);
    roofL.rotation.z = pitchRad;
    roofL.castShadow = true;
    group.add(roofL);

    const roofR = new THREE.Mesh(roofGeo, roofMat);
    roofR.position.set(halfSpan / 2, height + rise / 2 + 0.15, 0);
    roofR.rotation.z = -pitchRad;
    roofR.castShadow = true;
    group.add(roofR);

    // 3. Solar Panels (InstancedMesh)
    const totalPanels = CONFIG.solar.panelsPerRow * CONFIG.solar.rowsPerSlope * 2;

    // Geometry: X=Length(SlopeDir), Y=Thick, Z=Width(RowDir)
    // This alignment simplifies the rotation math along the slope.
    const panelMeshGeo = new THREE.BoxGeometry(CONFIG.solar.length, 0.04, CONFIG.solar.width);

    // Procedural Texture for Solar Panels
    const panelTex = createTextureFromCanvas(256, 164, (ctx, w, h) => {
        // Outer Frame (Dark grey - subtle against dark panel)
        ctx.fillStyle = '#444444';
        ctx.fillRect(0, 0, w, h);

        // Inner Glass (Near-black with slight blue tint)
        ctx.fillStyle = '#091428';
        ctx.fillRect(4, 4, w - 8, h - 8);

        // Grid Lines (Silver cell dividers)
        ctx.strokeStyle = '#aaaaaa'; // Dimmer grid lines
        ctx.globalAlpha = 0.2; // Keep grid lines subtle
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Grid divisions
        for (let i = 1; i < 6; i++) {
            ctx.moveTo(0, h * i / 6);
            ctx.lineTo(w, h * i / 6);
        }
        for (let j = 1; j < 10; j++) {
            ctx.moveTo(w * j / 10, 0);
            ctx.lineTo(w * j / 10, h);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha
    });

    const panelMat = new THREE.MeshStandardMaterial({
        map: panelTex,
        color: 0xffffff, // Use white to retain texture colors
        roughness: 0.1, // Restore glossiness
        metalness: 0.8, // Restore metalness for specular highlights
        emissive: 0x050a14, // Very faint blue emissive glow
        emissiveIntensity: 0.2
    });

    const solarInst = new THREE.InstancedMesh(panelMeshGeo, panelMat, totalPanels);
    const dummy = new THREE.Object3D();
    let pIdx = 0;

    // Left Slope loop
    for (let row = 0; row < CONFIG.solar.rowsPerSlope; row++) {
        for (let col = 0; col < CONFIG.solar.panelsPerRow; col++) {
            // Center of Left Roof section
            const cx = -halfSpan / 2;
            const cy = height + rise / 2 + 0.2;
            const cz = 0;

            // Offsets
            // xOffset (along slope): Centered around 0
            const xOffset = (row * (CONFIG.solar.length + CONFIG.solar.gapY)) - ((CONFIG.solar.rowsPerSlope * CONFIG.solar.length) / 2) + (CONFIG.solar.length / 2);
            // zOffset (along building length): Centered around 0
            const zOffset = (col * (CONFIG.solar.width + CONFIG.solar.gapX)) - ((CONFIG.solar.panelsPerRow * CONFIG.solar.width) / 2);

            // Create vector on unrotated plane (assuming plane is flat at y=0)
            // But our "Plane" is rotated by pitchRad around Z axis.
            // Actually, we can just position in local space and rotate the vector.

            // Vector pointing along slope (X) and building length (Z)
            const vec = new THREE.Vector3(xOffset, 0.05, zOffset);

            // Apply rotation around Z axis (pitch)
            vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), pitchRad);

            dummy.position.set(cx + vec.x, cy + vec.y, cz + vec.z);
            dummy.rotation.set(0, 0, 0);
            dummy.rotation.z = pitchRad;

            dummy.updateMatrix();
            solarInst.setMatrixAt(pIdx++, dummy.matrix);
        }
    }

    // Right Slope loop
    for (let row = 0; row < CONFIG.solar.rowsPerSlope; row++) {
        for (let col = 0; col < CONFIG.solar.panelsPerRow; col++) {
            const cx = halfSpan / 2;
            const cy = height + rise / 2 + 0.2;
            const cz = 0;
            const pitchRadR = -pitchRad;

            // Mirror logic for X offset? 
            // If we rotate by -pitch, positive X goes "down" to the right? 
            // Standard rotation: +X moves Right/Up.
            // Width of building is X axis.
            // Center of right Slope is +X.
            // We want panels to start from... top or bottom? 
            // Let's assume symmetric.

            // For right slope, ensure we flip xOffset if needed so rows order correctly or just symmetric is fine.
            const xOffset = (row * (CONFIG.solar.length + CONFIG.solar.gapY)) - ((CONFIG.solar.rowsPerSlope * CONFIG.solar.length) / 2) + (CONFIG.solar.length / 2);
            // Flip xOffset to mirror properly? 
            // If xOffset is positive, it moves "UP" the slope (towards apex) if we stick to the local X definition.
            // Whatever, symmetric distribution is fine.
            const zOffset = (col * (CONFIG.solar.width + CONFIG.solar.gapX)) - ((CONFIG.solar.panelsPerRow * CONFIG.solar.width) / 2);

            // We use -xOffset approx to match left side logic if we want "row 0" to be same relative pos
            // Slight adjustment to cx to prevent ridge overlapping, offset slightly down the slope
            const overhangFix = 0.2; // Move it down slope slightly to prevent overhang at ridge
            const vec = new THREE.Vector3(-xOffset, 0.05, zOffset);
            vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), pitchRadR);

            // Adding overhangFix to move away from ridge slightly
            const cxFix = cx + (Math.cos(pitchRadR) * overhangFix);
            const cyFix = cy - (Math.sin(Math.abs(pitchRadR)) * overhangFix);

            dummy.position.set(cxFix + vec.x, cyFix + vec.y, cz + vec.z);
            dummy.rotation.set(0, 0, 0);
            dummy.rotation.z = pitchRadR;

            dummy.updateMatrix();
            solarInst.setMatrixAt(pIdx++, dummy.matrix);
        }
    }

    group.add(solarInst);

    group.position.set(offsetX, offsetY, 0);
    return group;
}

// Correct Panel Geo for the function above
// X=Length(SlopeDir), Y=Thick, Z=Width(RowDir)
const panelMeshGeoInst = new THREE.BoxGeometry(CONFIG.solar.length, 0.04, CONFIG.solar.width);
// Override the instanced mesh geo inside build function? 
// No, create global one or pass it. 
// For simplicity, I'll redraw the function logic slightly in actual run to use correct geo.
// Re-doing the geo def outside:

// --- Build It ---

// Building 1 (Cars) - Left side (-6m center, spans -12 to 0)
// Building 2 (Coaches) - Right side (+6m center, spans 0 to 12)
// This creates a shared column line at x=0, fulfilling "3 upright steels across".

const carPort = createStructure(-6.0, 0);
scene.add(carPort);

const coachPort = createStructure(6.0, 0);
scene.add(coachPort);

// Central Gutter/Connector
const gutterGeo = new THREE.BoxGeometry(0.5, 0.2, CONFIG.structure.length); // Visual gutter strip
const gutterMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const gutter = new THREE.Mesh(gutterGeo, gutterMat);
// Position at Eaves height (5m)
gutter.position.set(0, CONFIG.structure.eavesHeight, 0);
scene.add(gutter);

// --- Container (Between Pitch and Car Port) ---
function createContainer(customLength = null) {
    const group = new THREE.Group();
    const width = 8;
    const height = 5;
    const length = customLength || CONFIG.structure.length; // Matches car port length length

    // Procedural texture for trapezoidal sheeting (vertical dark grey/black stripes)
    const sheetTex = createTextureFromCanvas(512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#0a0a0a'; // Dark base (valley)
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#111111'; // Lighter (ridge)
        const stripes = 40;
        const stripeW = w / stripes;
        for (let i = 0; i < stripes; i++) {
            // Draw a slightly lighter strip in the middle of each segment
            ctx.fillRect(i * stripeW + (stripeW * 0.2), 0, stripeW * 0.4, h);
        }
    });
    // Adjust wrapping for realism on a long object
    sheetTex.wrapS = THREE.RepeatWrapping;
    sheetTex.wrapT = THREE.RepeatWrapping;
    sheetTex.repeat.set(10, 1);

    const sheetMat = new THREE.MeshStandardMaterial({
        map: sheetTex,
        color: 0x111111, // Darken overall color
        roughness: 0.9, // Very rough
        metalness: 0.1 // Not very metallic
    });

    const geo = new THREE.BoxGeometry(width, height, length);
    const container = new THREE.Mesh(geo, sheetMat);
    container.position.set(0, height / 2, 0);
    container.castShadow = true;
    container.receiveShadow = true;
    group.add(container);

    return group;
}

const storageContainer = createContainer();
// Position in the gap between the car port (-12m edge) and pitch (-32.5m edge)
// User requested it match the red line rendering, filling the gap right up to the edge of the hardstanding
storageContainer.position.set(-16.0, 0, 0);
scene.add(storageContainer);

// Second Storage Container (South edge)
// Positioned in the gap between the main container and the south fence
const smallContainerLength = 7;
const smallContainer = createContainer(smallContainerLength);
// Bottom of main container is at z = 48 (length 96, centered at 0).
// 1.5m separation -> starts at z = 49.5
// Center = 49.5 + (7 / 2) = 53
smallContainer.position.set(-16.0, 0, 53.0);
scene.add(smallContainer);


// --- Cars & Coaches Sim ---
// Place random boxes
// --- Parking & Vehicles ---

function generateParking() {
    const group = new THREE.Group();
    const lineMat = new THREE.MeshBasicMaterial({ color: CONFIG.parking.car.lineColor });

    // --- Car Port (Port 1, Center X = -6) ---
    // Layout: 2 Rows angled at 45 deg.
    // Row 1: Left side of Port 1 (-6 - offset)
    // Row 2: Right side of Port 1 (-6 + offset)

    // Calculate geometry
    const bayW = CONFIG.parking.car.width;
    const bayL = CONFIG.parking.car.length;
    const angleRad = CONFIG.parking.car.angle * (Math.PI / 180);

    // Depth of angled bay perpendicular to aisle
    const bayDepth = (bayL * Math.sin(angleRad)) + (bayW * Math.cos(angleRad));
    // Actual space taken: 4.8*sin(45) + 2.4*cos(45) ~= 3.4 + 1.7 = 5.1m
    // Two rows = 10.2m. Leaves ~1.8m aisle in 12m span? A bit tight inside the columns.
    // User mentioned "5m + 5m + 2m aisle", so effectively perpendicular depth is ~5m.
    // Let's stick to the 45 deg.

    // Start positions (World Z starts at -LENGTH/2)
    // We space bays along the Z axis.
    // Spacing along aisle = BayWidth / sin(angle)
    const zSpacing = bayW / Math.sin(angleRad); // 2.4 / 0.707 ~= 3.4m spacing

    const numBays = Math.floor(CONFIG.structure.length / zSpacing) - 1;
    const startZ = -(CONFIG.structure.length / 2) + 2;

    // Helper for lines
    const createLine = (p1, p2) => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(CONFIG.parking.car.lineWidth, 0);
        shape.lineTo(CONFIG.parking.car.lineWidth, p1.distanceTo(p2));
        shape.lineTo(0, p1.distanceTo(p2));

        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, lineMat);
        mesh.rotation.x = -Math.PI / 2;

        // Align
        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        const angle = Math.atan2(dir.x, dir.z); // Z is "up" in 2D top down?
        // Actually simple placement:
        mesh.position.set(p1.x, 0.02, p1.z);
        mesh.rotation.z = -angle; // Check rotation

        return mesh;
    };

    // Actually, box lines are easier for 3D
    const createBoxLine = (x, z, len, rotY) => {
        const g = new THREE.BoxGeometry(CONFIG.parking.car.lineWidth, 0.02, len);
        const m = new THREE.Mesh(g, lineMat);
        m.position.set(x, 0.02, z);
        m.rotation.y = rotY;
        return m;
    };

    const port1Center = -6.0;

    // We adjust offsets to fit inside the 12m width (from -12 to 0 for Port 1)
    // Columns are at -12 and 0.
    // Aisle center at -6.
    // 6m half-width.
    // Bay Depth ~5.1m.
    // So bays start near columns and point inward? Or outward?
    // "Herringbone" usually points in direction of travel.
    // Let's assume standard layout: Cars park nose-in or nose-out.
    // Angled usually means Nose-In relative to flow.

    // Row 1 (Left of aisle): x = -6 - 1.0 (Aisle/2)? 
    // If Aisle is 2m, offset is 1m.
    // Bays extend to Left (-12).
    // Let's place the "Aisle Line" marking.

    // Let's iterate bays
    for (let i = 0; i < numBays; i++) {
        const z = startZ + (i * zSpacing);

        // ROW 1 (Left Side of Port 1)
        // Position: x < -6. 
        // Rotation: +45 or -45?
        // Let's say car drives UP (Z+) the aisle. Left bays trigger turn Left.
        // Bay angle: 45 deg.

        // Line Geometry logic:
        // A line of length `bayL` at angle.
        // Pivot at aisle line.
        const aisleX_L = port1Center - 1.5; // 3m aisle total?

        // Draw Bay Divider
        // Origin: (aisleX_L, z)
        // Angle: 45 deg. (x - 1, z + 1) -> pointing Left/Up?
        // x component = -sin(45) * L ??
        // To point Left and Up: x decreases, z increases.

        const lineLen = bayL;
        const rotL = Math.PI / 4; // 45 deg

        // Center of line depends on geometry.
        // x = aisleX_L - (sin(rotL) * len/2)
        // z = z - (cos(rotL) * len/2) ... careful with coord systems

        // Using simple Box rotation
        // Left Row Line
        const lLine = createBoxLine(
            aisleX_L - (Math.sin(rotL) * lineLen / 2),
            z + (Math.cos(rotL) * lineLen / 2),
            lineLen,
            rotL
        );
        group.add(lLine);

        // Row 2 (Right Side of Port 1)
        // Mirror image?
        // x > -6.
        const aisleX_R = port1Center + 1.5;
        const rotR = -Math.PI / 4; // -45 deg (Right and Up)

        const rLine = createBoxLine(
            aisleX_R + (Math.sin(Math.abs(rotR)) * lineLen / 2),
            z + (Math.cos(Math.abs(rotR)) * lineLen / 2),
            lineLen,
            rotR
        );
        group.add(rLine);

        // --- Add Cars (Randomly) ---
        if (Math.random() > 0.3) {
            const colors = CONFIG.parking.car.colors;
            const chosen = colors ? colors[Math.floor(Math.random() * colors.length)].color : 0x444444;
            const car = createCarStructure(chosen);

            // Position: Center of the bay we just drew lines for?
            // Actually lines are dividers. Car centers are between lines.
            // Z center = z + zSpacing/2? No, geometry is complex.
            // Center is roughly (divider Z + next divider Z)/2

            // Simpler: Just place relative to line
            // Center of bay is offset by (zSpacing/2) along Z? No.

            // Perpendicular offset from line: BayWidth/2

            // Let's just place cars at 'z' aligned with line for simplicity in this pass, 
            // offset by BayWidth/2 perpendicular to angle.

            // Left Row Car
            // Pos = LineCenter + Vector(-cos(45), sin(45)) * width/2 ??

            // Just offset Z by zSpacing/2 and use same math for position
            const carZ = z + (zSpacing / 2);

            // Recalc pos for Car Center
            // Left
            const cX_L = aisleX_L - (Math.sin(rotL) * lineLen / 2) - (Math.cos(rotL) * bayW / 2 * 0.8); // slight tweak
            const cZ_L = carZ + (Math.cos(rotL) * lineLen / 2); // crude approx

            // Precise
            // X = aisleX_L - (sin(45) * 2.4) (half length)
            const carDist = 2.4; // Midpoint of 4.8m length
            const xL = aisleX_L - (Math.sin(rotL) * carDist);
            const zL = carZ + (Math.cos(rotL) * carDist);

            car.position.set(xL, 0.02, zL);
            car.rotation.y = rotL + Math.PI; // Flipped direction
            car.castShadow = true;
            group.add(car);
        }

        if (Math.random() > 0.3) {
            // Right Row Car
            const colors = CONFIG.parking.car.colors;
            const chosen = colors ? colors[Math.floor(Math.random() * colors.length)].color : 0x444444;
            const car = createCarStructure(chosen);

            const carDist = 2.4;
            const carZ = z + (zSpacing / 2);

            const xR = aisleX_R + (Math.sin(Math.abs(rotR)) * carDist);
            const zR = carZ + (Math.cos(Math.abs(rotR)) * carDist);

            car.position.set(xR, 0.02, zR);
            car.rotation.y = rotR + Math.PI; // Flipped direction
            car.castShadow = true;
            group.add(car);
        }
    }

    // --- Coach Port (Port 2, Center X = 6) ---
    // Single Row of Angled 3.5m x 12m bays at 30 degrees
    const coachW = CONFIG.parking.coach.width;
    const coachL = CONFIG.parking.coach.length; // 12m
    const coachAngle = CONFIG.parking.coach.angle * (Math.PI / 180); // 30 deg

    // Calculate spacing along Z axis for angled bays: W / sin(angle)
    const coachZSpacing = coachW / Math.sin(coachAngle);

    // Fit bays within length. 
    const numCoachBays = Math.floor((CONFIG.structure.length - 10) / coachZSpacing);
    const coachStartZ = -(CONFIG.structure.length / 2) + 10;

    const port2Center = 6.0;

    // 12m length at 30 deg: X_width = 12 * sin(30) = 6m. 
    // 3.5m width at 30 deg: X_width_perp = 3.5 * cos(30) = 3.03m.
    // Total X width occupied = 9.03m.
    // 12m available. 12 - 9.03 = ~2.97m aisle.
    // Let's shift it so the 'front' of the bay is near the aisle.

    const coachLineMat = new THREE.MeshBasicMaterial({ color: CONFIG.parking.coach.lineColor });

    for (let i = 0; i < numCoachBays; i++) {
        const z = coachStartZ + (i * coachZSpacing);

        // Pivot point (Aisle side):
        const aisleX = port2Center - 3.0; // Shifted left to make room

        const lineLen = coachL;
        const rot = -coachAngle; // Rotate towards the back

        // Left boundary of the bay
        const lLine = createBoxLine(
            aisleX + (Math.sin(Math.abs(rot)) * lineLen / 2),
            z + (Math.cos(Math.abs(rot)) * lineLen / 2),
            lineLen,
            rot
        );
        lLine.material = coachLineMat;
        group.add(lLine);

        // Add a Coach Model (Randomly)
        if (Math.random() > 0.4) {
            const colors = CONFIG.parking.coach.colors;
            const chosen = colors[Math.floor(Math.random() * colors.length)].color;
            const coach = createCoachStructure(chosen);

            // Offset perpendicular to line angle by width/2
            const centerX = aisleX + (Math.sin(Math.abs(rot)) * lineLen / 2) + (Math.cos(Math.abs(rot)) * coachW / 2);
            const centerZ = z + (Math.cos(Math.abs(rot)) * lineLen / 2) - (Math.sin(Math.abs(rot)) * coachW / 2);

            coach.position.set(centerX, 0.02, centerZ);
            coach.rotation.y = rot + Math.PI; // Flipped direction
            coach.castShadow = true;
            group.add(coach);
        }
    }

    return group;
}

const parkingGroup = generateParking();
scene.add(parkingGroup);

// --- Environment ---

function createTextureFromCanvas(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

function createEnvironment() {
    const group = new THREE.Group();

    // 1. Hard Standing Area (Tarmac / Dark Asphalt tight to structures)
    const hardStandingTex = createTextureFromCanvas(512, 512, (ctx, w, h) => {
        ctx.fillStyle = '#2d2d2d'; // Darker gray base (Tarmac)
        ctx.fillRect(0, 0, w, h);
        // Add noise
        for (let i = 0; i < 50000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#363636' : '#242424';
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
    });
    // Adjust texture tiling slightly for darker tarmac
    hardStandingTex.wrapS = THREE.RepeatWrapping;
    hardStandingTex.wrapT = THREE.RepeatWrapping;
    hardStandingTex.repeat.set(15, 30);

    const hardStandingMat = new THREE.MeshStandardMaterial({
        map: hardStandingTex,
        roughness: 0.9,
        metalness: 0.1
    });

    // Tarmac Rect 1: Under Car/Coach Ports
    // Fits from X=-12 to X=14. Length -50 to +50
    const portsWidth = 26; // X from -12 to 14
    const portsLength = 100; // Z from -50 to 50
    const portsTarmacGeo = new THREE.PlaneGeometry(portsWidth, portsLength);
    const portsTarmac = new THREE.Mesh(portsTarmacGeo, hardStandingMat);
    portsTarmac.rotation.x = -Math.PI / 2;
    portsTarmac.position.set(1, 0.05, 0); // X center 1
    portsTarmac.receiveShadow = true;
    group.add(portsTarmac);

    // Tarmac Rect 2: Under Containers
    // Fits from X=-22 to X=-12. Length -50 to 58.5
    const contWidth = 10; // X from -22 to -12
    const contLength = 108.5; // Z from -50 to 58.5
    const contTarmacGeo = new THREE.PlaneGeometry(contWidth, contLength);
    const contTarmac = new THREE.Mesh(contTarmacGeo, hardStandingMat);
    contTarmac.rotation.x = -Math.PI / 2;
    contTarmac.position.set(-17, 0.05, 4.25); // Z center (-50 + 58.5)/2 = 4.25
    contTarmac.receiveShadow = true;
    group.add(contTarmac);

    // 2. Sports Pitch (Adjacent)
    const pitchW = 75;
    const pitchL = 110;
    const pitchTex = createTextureFromCanvas(1024, 1024, (ctx, w, h) => {
        // Grass base
        ctx.fillStyle = '#2d5a27'; // Football pitch green
        ctx.fillRect(0, 0, w, h);

        // Mowing strips (optional subtle variation)
        ctx.fillStyle = '#32612b';
        const strips = 10;
        const stripH = h / strips;
        for (let i = 0; i < strips; i += 2) {
            ctx.fillRect(0, i * stripH, w, stripH);
        }

        // Lines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;

        // Border
        const pad = 20;
        ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

        // Center Line
        ctx.beginPath();
        ctx.moveTo(pad, h / 2);
        ctx.lineTo(w - pad, h / 2);
        ctx.stroke();

        // Center Circle
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Goal Areas (Approx)
        const goalW = 200;
        const goalH = 80;

        // Top Goal
        ctx.strokeRect((w - goalW) / 2, pad, goalW, goalH);
        // Bottom Goal
        ctx.strokeRect((w - goalW) / 2, h - pad - goalH, goalW, goalH);
    });

    const pitchMat = new THREE.MeshStandardMaterial({
        map: pitchTex,
        roughness: 0.8
    });
    const pitch = new THREE.Mesh(new THREE.PlaneGeometry(pitchW, pitchL), pitchMat);
    pitch.rotation.x = -Math.PI / 2;

    // Pitch position
    // Shifted from -55.5 to -56.5 to ensure absolute clearance from the black container
    // Container left edge is at x = -20
    // Pitch is width 70 (spans from x-35 to x+35)
    // So if pitch center is -56.5, right edge is -21.5. Clears container by 1.5m.
    pitch.position.set(-56.5, 0.06, 0); // Raised slightly above hardstanding level
    pitch.receiveShadow = true;
    group.add(pitch);

    // 3. General Ground Plane (Grass)
    // Cropped to active area, dynamically adjusted to include expanded pitch gap
    const groundGeo = new THREE.PlaneGeometry(250, 250);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a5f0b, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-40, -0.1, 0); // Lowered significantly to avoid z-fighting
    ground.receiveShadow = true;
    group.add(ground);

    // 4. Road (Running along the left/east side of the car port)
    // From the user's top-down view, the road runs vertically along the far side
    // of the structures (positive X side, beyond the coach port)
    const roadWidth = 6;
    const roadLength = 200;
    const roadTex = createTextureFromCanvas(256, 256, (ctx, w, h) => {
        // Dark tarmac base
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, w, h);
        // Asphalt noise
        for (let i = 0; i < 20000; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? '#3a3a3a' : '#2a2a2a';
            ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
        }
        // Center dashed line
        ctx.fillStyle = '#ffffff';
        const dashLen = 30;
        const gapLen = 20;
        const lineW = 4;
        for (let y = 0; y < h; y += dashLen + gapLen) {
            ctx.fillRect((w - lineW) / 2, y, lineW, dashLen);
        }
    });
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 20);

    const roadMat = new THREE.MeshStandardMaterial({
        map: roadTex,
        roughness: 0.85,
        metalness: 0.05
    });
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(20, 0.04, 0); // Just beyond the coach port edge
    road.receiveShadow = true;
    group.add(road);

    return group;
}

const envGroup = createEnvironment();
scene.add(envGroup);

// --- Vegetation ---
function createTree() {
    const group = new THREE.Group();

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4d2926, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.75;
    trunk.castShadow = true;
    group.add(trunk);

    // Foliage (Low Poly)
    const leavesGeo = new THREE.DodecahedronGeometry(1.5);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 2.5;
    leaves.castShadow = true;
    group.add(leaves);

    return group;
}

const treeGroup = new THREE.Group();
for (let i = 0; i < 80; i++) {
    const tree = createTree();

    // Random Position within wider bounds
    // x: -120 to +30
    // z: -80 to +80
    let x = (Math.random() * 150) - 120; // -120 to +30
    let z = (Math.random() * 160) - 80; // -80 to +80

    // Exclusion zones
    // Tarmac area bounds: X runs -22 to 14, Z runs -52 to 62
    const inStructureZone = (x > -24 && x < 16) && (z > -52 && z < 62);
    // Pitch exclusion
    const inPitchZone = (x > -100 && x < -10) && (z > -70 && z < 70);
    // Road exclusion (road at x=20, width 6 -> 17 to 23)
    const inRoadZone = (x > 16 && x < 24) && (z > -100 && z < 100);

    if (!inStructureZone && !inPitchZone && !inRoadZone) {
        tree.position.set(x, 0, z);

        const scale = 0.8 + Math.random() * 0.4;
        tree.scale.setScalar(scale);
        tree.rotation.y = Math.random() * Math.PI;

        treeGroup.add(tree);
    }
}
scene.add(treeGroup);

// --- Sky ---
function createSky() {
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    const sun = new THREE.Vector3();

    const effectController = {
        turbidity: 2, // Clearer sky
        rayleigh: 0.5, // Less scattering, deep blue
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 38, // Slightly higher for brighter overall light
        azimuth: 40, // Flipped to opposite side - sun from upper right
        exposure: 0.9 // Bright enough for good panel reflections
    };

    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = effectController.turbidity;
    uniforms['rayleigh'].value = effectController.rayleigh;
    uniforms['mieCoefficient'].value = effectController.mieCoefficient;
    uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad(90 - effectController.elevation);
    const theta = THREE.MathUtils.degToRad(effectController.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);

    // Update Directional Light to match Sun position
    sunLight.position.set(sun.x * 100, sun.y * 100, sun.z * 100);

    renderer.toneMappingExposure = effectController.exposure;
    return sky;
}
const sky = createSky();

// --- Fencing ---
function createFence(length, height) {
    const group = new THREE.Group();

    // 1. Posts
    const postSpacing = 3.0;
    const postCount = Math.floor(length / postSpacing) + 1;
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, height, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });

    for (let i = 0; i < postCount; i++) {
        const x = (i * postSpacing) - (length / 2);
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(x, height / 2, 0);
        group.add(post);
    }

    // 2. Chain-link Mesh (Procedural Texture)
    const fenceTex = createTextureFromCanvas(512, 512, (ctx, w, h) => {
        // Transparent background
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;

        // Diagonal grid
        const step = 40;
        ctx.beginPath();
        for (let x = -h; x < w + h; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x + h, h);

            ctx.moveTo(x + step / 2, 0);
            ctx.lineTo(x + step / 2 - h, h);
        }
        ctx.stroke();
    });

    const fenceMat = new THREE.MeshStandardMaterial({
        map: fenceTex,
        color: 0xaaaaaa,
        side: THREE.DoubleSide,
        transparent: true,
        alphaTest: 0.5, // Crisp cutout
        roughness: 0.8,
        metalness: 0.4
    });

    const meshGeo = new THREE.PlaneGeometry(length, height);
    const fenceMesh = new THREE.Mesh(meshGeo, fenceMat);
    fenceMesh.position.set(0, height / 2, 0);
    group.add(fenceMesh);

    return group;
}

function createSportsPitchFence() {
    const group = new THREE.Group();
    // Pitch is at x = -60. Dimensions approx 75 (W) x 110 (L).
    // Fence should surround it with margin.
    const fenceW = 80;
    const fenceL = 115;
    const height = 3.0; // High ball trellis

    const marginX = -56.5; // Matches shifted pitch position

    // North Side (Top)
    const north = createFence(fenceW, height);
    north.position.set(marginX, 0, -fenceL / 2);
    group.add(north);

    // South Side
    const south = createFence(fenceW, height);
    south.position.set(marginX, 0, fenceL / 2);
    group.add(south);

    // East Side (Right - closing to structures) - REMOVED AS REQUESTED
    // const east = createFence(fenceL, height);
    // east.rotation.y = Math.PI / 2;
    // east.position.set(marginX + fenceW / 2, 0, 0);
    // group.add(east);

    // West Side
    const west = createFence(fenceL, height);
    west.rotation.y = Math.PI / 2;
    west.position.set(marginX - fenceW / 2, 0, 0);
    group.add(west);

    return group;
}

const fenceGroup = createSportsPitchFence();
scene.add(fenceGroup);

// Note: Lighting is already set up at the top of the file.
// Adjustments can be made there if needed.

// --- Sun Position Sliders ---
function updateSunPosition(elevation, azimuth) {
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    const sunPos = new THREE.Vector3();
    sunPos.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sunPos);
    sunLight.position.set(sunPos.x * 100, sunPos.y * 100, sunPos.z * 100);
}

const elevSlider = document.getElementById('sun-elevation');
const azimSlider = document.getElementById('sun-azimuth');
const elevVal = document.getElementById('elev-val');
const azimVal = document.getElementById('azim-val');

if (elevSlider && azimSlider) {
    elevSlider.addEventListener('input', () => {
        elevVal.textContent = elevSlider.value + '°';
        updateSunPosition(Number(elevSlider.value), Number(azimSlider.value));
    });
    azimSlider.addEventListener('input', () => {
        azimVal.textContent = azimSlider.value + '°';
        updateSunPosition(Number(elevSlider.value), Number(azimSlider.value));
    });
}

// --- Animation Loop ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
